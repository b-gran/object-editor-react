/*
 * Component for viewing the shape of a schema.
 */

import React from 'react'
import { PropTypes as Props } from './constants'
import PropTypes from 'prop-types'

import { Div, Span } from 'glamorous'

import * as _ from 'lodash'

const SCHEMA_TYPE_IDENTIFIER = {
  // "nested" schema types
  shape: 'shape',
  arrayOf: 'arrayOf',

  // "primitive"/leaf schema types
  any: 'any',
  string: 'string',
  boolean: 'boolean',
  function: 'function',
  number: 'number',
  date: 'date',
  array: 'array',
  object: 'object',
}

// Assumes schema is already a valid Schema.
// Returns the corresponding type identifier (a string from the object above) for the schema.
function getSchemaTypeIdentifier (schema) {
  return schema._isSchemaType
    ? schema._type
    : SCHEMA_TYPE_IDENTIFIER.shape
}

const monospace = { fontFamily: 'monospace' }
const keyName = { ...monospace, color: '#b966b1' }

export default class SchemaView extends React.Component {
  static displayName = 'SchemaView'
  static propTypes = {
    schema: Props.Schema.isRequired,
    keyName: PropTypes.string,
  }

  state = {
    expanded: false,
  }

  toggleExpanded () {
    this.setState({
      expanded: !this.state.expanded,
    })
  }

  render () {
    const identifier = getSchemaTypeIdentifier(this.props.schema)
    switch (identifier) {
      case SCHEMA_TYPE_IDENTIFIER.any:
      case SCHEMA_TYPE_IDENTIFIER.string:
      case SCHEMA_TYPE_IDENTIFIER.boolean:
      case SCHEMA_TYPE_IDENTIFIER.function:
      case SCHEMA_TYPE_IDENTIFIER.number:
      case SCHEMA_TYPE_IDENTIFIER.date:
      case SCHEMA_TYPE_IDENTIFIER.array:
      case SCHEMA_TYPE_IDENTIFIER.object:
        if (typeof this.props.keyName === 'string') {
          return <KeyValueSchemaView
            preview={<LeafSchema schemaTypeName={identifier} />}
            schemaElement={<LeafSchema schemaTypeName={identifier} />}
            keyName={this.props.keyName}/>
        }

        return <LeafSchema schemaTypeName={identifier} />

      case SCHEMA_TYPE_IDENTIFIER.shape:
        if (typeof this.props.keyName === 'string') {
          return <KeyValueSchemaView
            schemaElement={<ShapeSchema schema={this.props.schema}/>}
            keyName={this.props.keyName}
            onToggleExpanded={this.toggleExpanded.bind(this)}
            preview="Shape"
            expanded={this.state.expanded}/>
        }

        return <ShapeSchema schema={this.props.schema}/>

      case SCHEMA_TYPE_IDENTIFIER.arrayOf:
        if (typeof this.props.keyName === 'string') {
          return <KeyValueSchemaView
            schemaElement={<SchemaView schema={this.props.schema._elementType}/>}
            keyName={this.props.keyName}
            onToggleExpanded={this.toggleExpanded.bind(this)}
            preview="ArrayOf"
            expanded={this.state.expanded}/>
        }

        return <Div display="flex" flexDirection="column">
          <Div css={monospace}>ArrayOf</Div>
          <SchemaView schema={this.props.schema._elementType}/>
        </Div>

      default:
        throw new Error('invalid schema type identifier')
    }
  }
}

class LeafSchema extends React.Component {
  static displayName = 'LeafSchema'
  static propTypes = {
    schemaTypeName: PropTypes.node.isRequired,
  }

  render () {
    return <Div css={monospace}>{this.props.schemaTypeName}</Div>
  }
}

class ShapeSchema extends React.Component {
  static displayName = 'ShapeSchema'
  static propTypes = {
    schema: Props.Schema.isRequired,
  }

  render () {
    return <div>
      {
        _.toPairs(this.props.schema).map(([ key, schema ]) =>
          <SchemaView key={key} schema={schema} keyName={key} />
        )
      }
    </div>
  }
}

const TRIANGLE_RIGHT = '▶'
const TRIANGLE_DOWN = '▼'
const TRIANGLE_EXPANDER_WIDTH = "16px"

class KeyValueSchemaView extends React.Component {
  static displayName = 'KeyValueSchemaView'
  static propTypes = {
    // Rendering of the actual schema
    schemaElement: PropTypes.node.isRequired,

    // For expandable schemas, the preview of the schema to show in line with the key
    preview: PropTypes.node.isRequired,

    keyName: PropTypes.string.isRequired,
    expanded: PropTypes.bool,
    onToggleExpanded: PropTypes.func,
  }

  render () {
    const readableKeyName = this.props.keyName === ''
      ? `""`
      : this.props.keyName

    // Non-expandable key/value pairs
    if (!this.props.onToggleExpanded) {
      return (
        <Div display="flex" cursor="default">
          <Div width={TRIANGLE_EXPANDER_WIDTH} />
          <Div display="flex" flexDirection="row">
            <Div marginRight="10px" css={keyName}
                 onClick={this.props.onToggleExpanded}>{readableKeyName}:</Div>
            <Div css={monospace}>{this.props.preview}</Div>
          </Div>
        </Div>
      )
    }

    const arrow = this.props.expanded ? TRIANGLE_DOWN : TRIANGLE_RIGHT
    return (
      <Div display="flex" cursor="default">
        <Div display="flex" width={TRIANGLE_EXPANDER_WIDTH} onClick={this.props.onToggleExpanded}>
          <Span fontSize="9px" padding="2px">{ arrow }</Span>
        </Div>
        <Div display="flex" flexDirection="column">
          <Div display="flex" flexDirection="row" onClick={this.props.onToggleExpanded}>
            <Div marginRight="10px" css={keyName}>{readableKeyName}:</Div>
            <Div css={monospace}>{this.props.preview}</Div>
          </Div>

          { this.props.expanded && <Div>{ this.props.schemaElement }</Div> }
        </Div>
      </Div>
    )
  }
}