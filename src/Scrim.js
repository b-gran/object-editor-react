/*
 * Adapted from pivotal-ui's scrim mixin
 *      See https://github.com/pivotal-cf/pivotal-ui/blob/development/library/src/pivotal-ui-react/mixins/mixins/scrim_mixin.js
 */
import PropTypes from 'prop-types';

import React from 'react';
import { findDOMNode } from 'react-dom';
import ReactDOM from 'react-dom'

// Mapping of Scrims -> scrim click handlers
const privates = new WeakMap();

// Handler for clicks on the document root
// Needs to be bound to a Scrim instance like so:
// class Scrim extends React.Component {
//      constructor (props) {
//          ...
//          const myRootClick = rootClick.bind(this, myScrimClickHandler);
//      }
//      ...
// }
function rootClick (handler, evt) {
    if (findDOMNode(this).contains(evt.target)) {
        return;
    }

    handler(evt);
}

/*
 * Returns a Scrim'd version of Component that accepts the props `onClickScrim`,
 * a function that gets called when the component's scrim is clicked.
 */
export default function (Component) {
    return class Scrim extends React.Component {
        static displayName = 'Scrim';

        static propTypes = {
            // Handler called when the scrim is clicked
            onClickScrim: PropTypes.func.isRequired,
        };

        constructor (props) {
            super(props);

            // Add our bound root click handler to privates
            privates.set(this, rootClick.bind(this, props.onClickScrim));
        }

        // Update our private var & document listener when new props passed
        componentWillReceiveProps (nextProps) {
            // Remove current listener
            document.documentElement.removeEventListener('click', privates.get(this));

            // Update listener var
            privates.set(this, rootClick.bind(this, nextProps.onClickScrim));

            // Add new listener
            document.documentElement.addEventListener('click', privates.get(this));
        }

        // Add our root click listener to the document when the component mounts.
        componentDidMount () {
            super.componentDidMount && super.componentDidMount.apply(this, arguments);
            document.documentElement.addEventListener('click', privates.get(this));
        }

        // Remove our root click listener to the document when the component unmounts.
        componentWillUnmount () {
            super.componentWillUnmount && super.componentWillUnmount.apply(this, arguments);
            document.documentElement.removeEventListener('click', privates.get(this));
        }

        render () {
            return <Component { ...this.props } />;
        }
    };
}

export class ScrimComponent extends React.Component {
  static displayName = 'ScrimComponent';

  static propTypes = {
    // Handler called when the scrim is clicked
    onClickScrim: PropTypes.func.isRequired,

    disabled: PropTypes.bool,
  };

  constructor (props) {
    super(props);

    this.handleRootClick = evt => {
      // Performance: skip expensive DOM operations if the consumer
      // tells us it's safe.
      if (this.props.disabled) {
        return
      }

      if (ReactDOM.findDOMNode(this).contains(evt.target)) {
        return
      }

      return this.props.onClickScrim(evt)
    }
  }

  componentDidMount () {
    document.body.addEventListener('click', this.handleRootClick)
  }

  componentWillUnmount () {
    document.body.removeEventListener('click', this.handleRootClick)
  }

  render () {
    return this.props.children
  }
}
