use serde_derive::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Configuration {
    pub server: ServerConfiguration,
    pub agent: AgentConfiguration
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServerConfiguration {
    pub url: String
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AgentConfiguration {
    pub work_path: String
}

fn main() {
    let config = std::fs::read_to_string("agent.toml").unwrap();
    let config: Configuration = toml::from_str(&config).unwrap();

    println!("{:?}", config);
}
