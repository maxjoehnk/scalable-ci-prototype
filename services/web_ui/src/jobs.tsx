import * as React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

const fetchRunningJobs = async () => {
    const res = await fetch('http://localhost:8080/api/jobs/running');
    const body = await res.json();

    return body;
};
const fetchPendingJobs = async () => {
    const res = await fetch('http://localhost:8080/api/jobs/pending');
    const body = await res.json();

    return body;
};

export const JobList = ({ className }) => {
    const [jobs, setJobs] = useState();

    useEffect(() => {
        const run = async() => {
            const running = await fetchRunningJobs();
            const pending = await fetchPendingJobs();

            setJobs([...running, ...pending]);
        };
        run();
    }, []);

    return <ul className={className}>{
        (jobs || []).map(job => <li key={job.id}>{job.id}</li>)
    }</ul>;
};