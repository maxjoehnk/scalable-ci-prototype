import * as React from 'react';
import { useEffect, useState } from 'react';

const fetchNodes = async () => {
    const res = await fetch('http://localhost:8080/api/nodes');
    const body = await res.json();

    return body;
};

export const NodeList = ({ className }: { className: string }) => {
    const [nodes, setNodes] = useState();

    useEffect(() => {
        fetchNodes().then(nodes => setNodes(nodes));
    }, []);

    return (<ul className={className}>{
        (nodes || []).map(n => <li>{n.id}</li>)
    }</ul>);
};