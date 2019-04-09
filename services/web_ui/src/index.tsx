import 'babel-polyfill';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { NodeList } from './nodes';
import { ProjectList } from './projects';
import { JobList } from './jobs';

const App = () => <div className="body">
    <NodeList className="nodes"/>
    <ProjectList className="projects"/>
    <JobList className="jobs"/>
</div>;

ReactDom.render(<App/>, document.getElementById('app'));

