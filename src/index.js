import React, { PropTypes, Component } from 'react';
import ReactDOM from 'react-dom';
import { ComputerEditor, KeyEditor, ObjectTypes } from './Editor.old';

import async from 'async';

console.log('running this');

// Which editor to render -- gets set by the view
// Possible types:
//      COMPUTERS | KEYS
const type = window.__EDITOR_TYPE__ || 'COMPUTERS';

async.parallel([
    // Computers
    done => fetch('/api/v1/computers?sort=machineName')
        .then(res => res.json())
        .then(res => done(null, res))
        .catch(err => done(err)),

    // Keys
    done => fetch('/api/v1/keys?sort=name')
        .then(res => res.json())
        .then(res => done(null, res))
        .catch(err => done(err)),
], (err, results) => {
    console.log('fetched!');

    if (err) {
        console.error('Could not retrieve computers or keys.');
        throw err;
    }

    const [ computers, keys ] = results;

    if (type === 'COMPUTERS') {
        ReactDOM.render(
            (
                <ComputerEditor computers={computers}/>
            ),
            document.getElementById('computers')
        );
    } else {
        ReactDOM.render(
            (
                <KeyEditor gatekeepers={keys}/>
            ),
            document.getElementById('keys')
        );
    }
});

