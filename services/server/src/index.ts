import { createServer } from 'http';
import * as express from 'express';
import * as WebSocket from 'ws'
import * as uuid from 'uuid/v4';
import * as cors from 'cors';

const app = express();

app.use(cors());

const server = createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
    const serialized = JSON.stringify(data);
    [...wss.clients]
        .filter(client => client.readyState === WebSocket.OPEN)
        .forEach(client => client.send(serialized));
}

const buildJobs = [
    {
        id: '2bae46aa-f253-4226-99c6-903423094383',
        label: 'Dashdown',
        repository: "https://github.com/maxjoehnk/dashdown",
        buildSteps: [
            {
                "type": "shell",
                "cmd": "npm install"
            },
            {
                "type": "shell",
                "cmd": "npm run lint"
            },
            {
                "type": "shell",
                "cmd": "npm run test"
            }
        ]
    }
];

interface BuildJob {
    id: string;
    project: string;
    running: boolean;
    currentStep?: number;
}

const runningJobs: BuildJob[] = [];

const buildQueue: BuildJob[] = [];

const buildNodes = [];

app.post('/api/projects/:id/run', (req, res, next) => {
    const project = buildJobs.find(j => j.id === req.params.id);

    const job: BuildJob = {
        id: uuid(),
        project: project.id,
        running: false
    };
    buildQueue.push(job);
    broadcast({
        type: 'BUILD_QUEUED',
        payload: {
            job
        }
    });
    res.status(204).end();
});

app.get('/api/nodes', (req, res, next) => {
    res.json(buildNodes);
});

app.get('/api/nodes/:id/nextJob', (req, res, next) => {
    if (buildQueue.length > 0) {
        const job = buildQueue.pop();
        runningJobs.push(job);
        const project = buildJobs.find(j => j.id === job.project);
        return res.json({
            ...job,
            project
        });
    }
    res.sendStatus(404).end();
});

app.post('/api/nodes/register', (req, res, next) => {
    const node = {
        id: uuid()
    };
    buildNodes.push(node);
    broadcast({
        type: 'NODE_REGISTERED',
        payload: {
            node
        }
    });
    res.json(node.id);
});

app.get('/api/projects', (req, res, next) => {
    const projects = buildJobs.map(job => ({
        id: job.id,
        label: job.label,
        repository: job.repository
    }));

    res.json(projects);
});

app.get('/api/jobs/pending', (req, res, next) => {
    res.json(buildQueue);
});

app.get('/api/jobs/running', (req, res, next) => {
    res.json(runningJobs);
});

app.listen(8080, () => console.log('Listening on Port 8080'));
