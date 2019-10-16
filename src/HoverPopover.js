import React from 'react'
import ReactDOM from 'react-dom'
import { delay, eventOnce, isDefined, NoOverflowModalManager } from './util'
import * as glamor from 'glamor'
import { Div } from 'glamorous'

import Popover from '@material-ui/core/Popover'
import * as R from 'ramda'

import PropTypes from 'prop-types'

// Performance: track the most recent mouse event for all Hovers.
const lastMousePosition = (() => {
  let latest = null

  if (typeof window !== 'undefined') {
    eventOnce('load', () => {
      window.addEventListener('mousemove', evt => (latest = evt.target))
    })(window)
  }

  return () => latest
})()

export class HoverPopover extends React.Component {
  static propTypes = {
    // Duration the mouse must be within the component before the hover begins.
    // May only be specified when the component mounts.
    hoverDurationMs: PropTypes.number,

    // Duration the mouse must be outside of the component before the hover ends.
    // May only be specified when the component mounts.
    hoverEndDurationMs: PropTypes.number,

    // Contents of the popover
    popoverContent: PropTypes.node.isRequired,

    // Styles to apply to the main content/popover wrapper
    containerStyles: PropTypes.object,
  }

  _refs = {
    // The DOM node for the popover content
    popoverContentElement: null,

    // The DOM node for the popover anchor
    popoverAnchorElement: null,
  }

  state = {
    hoverChildren: false,
  }

  constructor (props) {
    super(props)

    // Because the mouse listeners are delayed, we need to explicitly skip
    // dom operations after the component has been unmounted.
    this._isMounted = false

    // Create a handler that gets passed a boolean that's true
    // when the user is hovering over this component.
    // If canSkip is supplied, the operation will be skipped
    // whenever it returns true.
    this.checkHovering = (f, canSkip = R.F) => () => {
      if (!this._isMounted || canSkip()) {
        return
      }

      const position = lastMousePosition()
      if (!position) {
        return
      }

      const ownNode = ReactDOM.findDOMNode(this)
      const popoverContentNode = ReactDOM.findDOMNode(this._refs.popoverContentElement)
      const isHovering = (
        (ownNode && ownNode.contains(position)) ||
        (popoverContentNode && popoverContentNode.contains(position))
      )

      return f(isHovering)
    }

    const _handleBodyMove = this.checkHovering(isHovering => {
      if (!isHovering) {
        return this.setState({
          hoverChildren: false,
        })
      }
    }, () => !this.state.hoverChildren)

    // Handler for mouse moves outside of the component.
    this.handleBodyMove = isDefined(props.hoverEndDurationMs)
      ? delay(props.hoverEndDurationMs, _handleBodyMove)
      : _handleBodyMove

    const _handleComponentMove = this.checkHovering(isHovering => {
      if (isHovering) {
        return this.setState({
          hoverChildren: true,
        })
      }
    }, () => this.state.hoverChildren)

    // Handler for mouse moves within the component.
    this.handleComponentMove = isDefined(props.hoverDurationMs)
      ? delay(props.hoverDurationMs, _handleComponentMove)
      : _handleComponentMove
  }

  componentDidMount () {
    this._isMounted = true
    document.body.addEventListener('mousemove', this.handleBodyMove)
  }

  componentWillUnmount () {
    this._isMounted = false
    document.body.removeEventListener('mousemove', this.handleBodyMove)
  }

  render () {
    const { containerStyles = {} } = this.props
    return (
      <div style={containerStyles}
           onMouseMove={this.handleComponentMove}
           ref={popoverAnchor => { this._refs.popoverAnchorElement = popoverAnchor }}>
        {this.props.children}
        <Popover
          ref={popoverContent => { this._refs.popoverContentElement = popoverContent }}
          className={`${noPtrEvents}`}
          manager={NoOverflowModalManager}
          open={this.state.hoverChildren}
          anchorEl={this._refs.popoverAnchorElement}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          disableRestoreFocus>
          <Div pointerEvents="auto">
            {this.props.popoverContent}
          </Div>
        </Popover>
      </div>
    )
  }
}

// This property is needed on the popover to prevent mouse events on the Modal backdrop
// from hiding the Modal.
const noPtrEvents = glamor.css({ pointerEvents: 'none' })
