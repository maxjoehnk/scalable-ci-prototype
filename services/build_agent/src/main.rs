use futures::lazy;
use futures::prelude::*;
use futures::sync::mpsc;
use hyper::StatusCode;

use crate::build::*;
use crate::config::Configuration;

mod config;
mod build;

fn get_next_job(base_url: String) -> impl Future<Item=Option<BuildJob>, Error=()> {
    let next_job_url = format!("{}/api/nodes/id/nextJob", base_url).parse().unwrap();

    let client = hyper::Client::new();

    client.get(next_job_url)
        .map_err(|err| {
            eprintln!("get error {}", err)
        })
        .and_then(|res| {
            use futures::future::Either;
            if res.status() == StatusCode::NOT_FOUND {
                Either::A(futures::future::ok(None))
            } else {
                Either::B(res.into_body()
                    .concat2()
                    .map(|body| Some(serde_json::from_slice(&body).unwrap()))
                    .map_err(|_| ()))
            }
        })
}

fn main() {
    let config = std::fs::read_to_string("agent.toml").unwrap();
    let config: Configuration = toml::from_str(&config).unwrap();

    tokio::run(lazy(move || {
        let server_url = config.server.url.clone();
        tokio::spawn(lazy(move || {
            let client = hyper::Client::new();
            let register_url = format!("{}/api/register", server_url).parse().unwrap();
            client.get(register_url)
                .map(|_| {
                    println!("registered")
                })
                .map_err(|err| {
                    eprintln!("Error {}", err);
                })
        }));

        let (tx, rx) = mpsc::channel(0);

        tokio::spawn(lazy(|| {
            rx.for_each(|job| run_job(job))
        }));

        tokio::spawn(lazy(move || {
            use futures::stream;
            stream::repeat(())
                .for_each(move |_| {
                    let tx = tx.clone();
                    get_next_job(config.server.url.clone())
                        .and_then(|job| {
                            use futures::future::Either;
                            if let Some(job) = job {
                                println!("{:?}", job);
                                Either::A(tx.send(job)
                                    .map(|_| ())
                                    .map_err(|err| {
                                        eprintln!("err {}", err)
                                    }))
                            } else {
                                Either::B(futures::future::ok(()))
                            }
                        })
                })
        }));

        Ok(())
    }));
}
