import * as React from 'react';
import { useEffect, useState } from 'react';

const fetchProjects = async () => {
    const res = await fetch('http://localhost:8080/api/projects');
    const body = await res.json();

    return body;
};

const buildProject = async (project) => {
    await fetch(`http://localhost:8080/api/projects/${project.id}/run`, {
        method: 'POST'
    });
};

export const ProjectList = ({ className }) => {
    const [projects, setProjects] = useState();

    useEffect(() => {
        fetchProjects().then(setProjects);
    }, []);

    return <div className={`${className} project-list`}>
        {(projects || []).map(p => <div key={p.id} className="project-list__item">
            <h2>{p.label}</h2>
            <button className="project-list__build-btn" onClick={() => buildProject(p)}>Build</button>
        </div>)}
    </div>;
};