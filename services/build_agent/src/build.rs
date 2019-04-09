use std::path::Path;
use std::process::Command;

use futures::prelude::*;
use futures::stream;
use serde_derive::{Deserialize, Serialize};

use tokio_process::CommandExt;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum BuildStep {
    Shell {
        cmd: String
    }
}

impl BuildStep {
    fn execute<P: AsRef<Path>>(&self, cwd: P) -> impl Future<Item=(), Error=()> {
        match self {
            BuildStep::Shell { cmd } => {
                let mut parts = cmd.split_whitespace();
                let command = parts.nth(0).unwrap();
                let args: Vec<_> = parts.collect();

                Command::new(command)
                    .args(&args)
                    .current_dir(cwd)
                    .spawn_async()
                    .unwrap()
                    .map(|_| ())
                    .map_err(|err| {
                        eprintln!("Error {}", err);
                        ()
                    })
            }
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Project {
    pub id: String,
    pub label: String,
    #[serde(rename = "buildSteps")]
    pub steps: Vec<BuildStep>,
    pub repository: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct BuildJob {
    pub id: String,
    pub project: Project,
    pub running: bool,
}

pub fn run_job(job: BuildJob) -> impl Future<Item=(), Error=()> {
    println!("running job {:?}", job);

    let child = Command::new("git")
        .arg("clone")
        .arg(job.project.repository.clone())
        .arg("/tmp/test")
        .spawn_async()
        .unwrap();

    child
        .map_err(|err| {
            eprintln!("Error {}", err);
        })
        .and_then(|_| {
            stream::iter_ok(job.project.steps)
                .for_each(|step| step.execute("/tmp/test"))
        })
}
