import * as R from 'ramda'

import React from 'react'

import { ScrimComponent } from './Scrim'

import PropTypes from 'prop-types'

export const Position = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
}

export const Anchor = {
  start: 'start',
  middle: 'middle',
  end: 'end',
}

export const Alignment = {
  start: 'start',
  middle: 'middle',
  end: 'end',
}

// eslint-disable-next-line
const inverseOf = R.flip(R.prop)({
  [Position.top]: Position.bottom,
  [Position.bottom]: Position.top,
  [Position.left]: Position.right,
  [Position.right]: Position.left,
})

const isVertical = {
  [Position.top]: true,
  [Position.bottom]: true,
  [Position.left]: false,
  [Position.right]: false,
}

const isHorizontal = {
  [Position.top]: false,
  [Position.bottom]: false,
  [Position.left]: true,
  [Position.right]: true,
}

function getPosition (
  targetRect,
  contentDimensions,
  windowDimensions,
  position,
  alignment,
  anchor = Anchor.middle
) {
  const anchoredRect = anchorRect(targetRect, contentDimensions, position, anchor)

  return [
    clampRectangle(
      getXPosition(anchoredRect, contentDimensions, windowDimensions, position, alignment),
      contentDimensions.width,
      0,
      windowDimensions.width
    ),
    clampRectangle(
      getYPosition(anchoredRect, contentDimensions, windowDimensions, position, alignment),
      contentDimensions.height,
      0,
      windowDimensions.height
    ),
  ]
}

const errInvalidType = type => key => new TypeError(`Invalid ${type}: ${key} is not a ${type}.`)
const invalidAnchorMessage = errInvalidType('anchor')
const invalidPositionMessage = errInvalidType('position')
const invalidAlignmentMessage = errInvalidType('alignment')

// Adjust the hover content rectangle based on where it's anchored.
function anchorRect (targetRect, contentRect, position, anchor) {
  const baseClone = R.pick([ 'top', 'right', 'bottom', 'left', 'width', 'height' ])(targetRect)
  if (isVertical[position]) {
    switch (anchor) {
      case Anchor.start:
        return {
          ...baseClone,
          left: baseClone.left + 0.5 * contentRect.width,
          right: baseClone.right + 0.5 * contentRect.width,
        }

      case Anchor.middle:
        return baseClone

      case Anchor.end:
        return {
          ...baseClone,
          left: baseClone.left - 0.5 * contentRect.width,
          right: baseClone.right - 0.5 * contentRect.width,
        }

      default:
        throw invalidAnchorMessage(anchor)
    }
  }

  switch (anchor) {
    case Anchor.start:
      return {
        ...baseClone,
        top: baseClone.top + 0.5 * contentRect.height,
        bottom: baseClone.bottom + 0.5 * contentRect.height,
      }

    case Anchor.middle:
      return baseClone

    case Anchor.end:
      return {
        ...baseClone,
        top: baseClone.top - 0.5 * contentRect.height,
        bottom: baseClone.bottom - 0.5 * contentRect.height,
      }

    default:
      throw invalidAnchorMessage(anchor)
  }
}

// TODO: add back the logic for repositioning the Pin if it doesn't fit.
// eslint-disable-next-line
function doesContentFit (
  targetRect,
  contentDimensions,
  windowDimensions,
  position,
  alignment
) {
  const x = getXPosition(targetRect, contentDimensions, windowDimensions, position, alignment)
  const y = getYPosition(targetRect, contentDimensions, windowDimensions, position, alignment)

  const leftBound = x >= 0
  const rightBound = (x + contentDimensions.width <= windowDimensions.width)
  const topBound = y >= 0
  const bottomBound = (y + contentDimensions.height) <= windowDimensions.height

  switch (position) {
    case Position.left:
      return leftBound && topBound && bottomBound
    case Position.right:
      return rightBound && topBound && bottomBound
    case Position.top:
      return leftBound && rightBound && topBound
    case Position.bottom:
      return leftBound && rightBound && bottomBound

    default:
      throw invalidPositionMessage(position)
  }
}

function getXPosition (
  targetRect,
  { width: contentWidth },
  windowRect,
  position,
  alignment
) {
  const { left: targetLeft, right: targetRight } = targetRect

  if (isVertical[position]) {
    switch (alignment) {
      case Alignment.start:
        return targetLeft
      case Alignment.middle:
        return ((targetLeft + targetRight) / 2) - (contentWidth / 2)
      case Alignment.end:
        return targetRight - contentWidth

      default:
        throw invalidAlignmentMessage(alignment)
    }
  }

  switch (position) {
    case Position.left:
      return targetLeft - contentWidth
    case Position.right:
      return targetRight

    default:
      throw invalidPositionMessage(position)
  }
}

function getYPosition (
  targetRect,
  { height: contentHeight },
  windowRect,
  position,
  alignment
) {
  const { top: targetTop, bottom: targetBottom } = targetRect

  if (isHorizontal[position]) {
    switch (alignment) {
      case Alignment.start:
        return targetTop
      case Alignment.middle:
        return ((targetTop + targetBottom) / 2) - (contentHeight / 2)
      case Alignment.end:
        return targetBottom - contentHeight

      default:
        throw invalidAlignmentMessage(alignment)
    }
  }

  switch (position) {
    case Position.top:
      return targetTop - contentHeight
    case Position.bottom:
      return targetBottom

    default:
      throw invalidPositionMessage(position)
  }
}

// Clamp one dimension of a rectangle within some bounds.
function clampRectangle (position, length, min, max) {
  return Math.min(
    Math.max(position, min),
    max - length
  )
}

class Pin extends React.Component {
  constructor (props) {
    super(props)

    this._refs = {
      mainContent: null,
      hoverContent: null,
    }

    // Create a handler for keeping track of DOM across renders.
    // Triggers a render (after reflow) if all DOM hasn't loaded yet.
    this.trackRef = refName => el => {
      this._refs[refName] = el
    }
  }

  render () {
    const [x, y] = (() => {
      // We can't compute the position until we have refs for the main and hover content.
      // We also don't need to compute the position if the Pin is hidden.
      if (!this.props.visible || !this._refs.mainContent || !this._refs.hoverContent) {
        return [ 0, 0 ]
      }

      return getPosition(
        this._refs.mainContent.getBoundingClientRect(),
        this._refs.hoverContent.getBoundingClientRect(),
        {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        this.props.position || Position.bottom,
        this.props.alignment || Alignment.middle,
        this.props.anchor
      )
    })()

    return (
      <ScrimComponent disabled={!this.props.visible} onClickScrim={this.props.onScrimClick || R.T}>
        <div>
          <div ref={this.trackRef('mainContent')}>
            {this.props.children}
          </div>

          <div
            style={{
              position: 'fixed',
              display: 'block',
              left: `${x}px`,
              top: `${y}px`,
              visibility: this.props.visible ? 'visible' : 'hidden',
              zIndex: '1', // TODO: this should be a prop
            }}
            ref={this.trackRef('hoverContent')}>
            {this.props.pinContent}
          </div>
        </div>
      </ScrimComponent>
    )
  }
}

Pin.propTypes = {
  pinContent: PropTypes.node.isRequired,
  position: PropTypes.oneOf(R.values(Position)),
  alignment: PropTypes.oneOf(R.values(Alignment)),
  anchor: PropTypes.oneOf(R.values(Anchor)),

  marginLeft: PropTypes.string,

  // Optional handler for clicks outside the Pin.
  onScrimClick: PropTypes.func,

  // An override. If true, the Pin will always be visible (state changes won't affect it)
  visible: PropTypes.bool,
}

export default Pin
