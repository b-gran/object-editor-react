/*
 * Component for viewing the shape of a schema.
 */

import React from 'react'
import { PropTypes as Props } from './constants'
import PropTypes from 'prop-types'

import glamorous, { Div } from 'glamorous'

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
          return <Div display="flex" flexDirection="row">
            <Div marginRight="10px" css={keyName}>{this.props.keyName}:</Div>
            <div><SchemaLeaf schemaTypeName={identifier}/></div>
          </Div>
        }
        return <SchemaLeaf schemaTypeName={identifier}/>

      case SCHEMA_TYPE_IDENTIFIER.shape:
        if (typeof this.props.keyName === 'string') {
          return <Div display="flex" flexDirection="column">
            <Div display="flex" flexDirection="row">
              <Div marginRight="10px" css={keyName}>{this.props.keyName}:</Div>
              <Div css={monospace}>Shape</Div>
            </Div>

            <Div marginLeft="20px"><ShapeSchema schema={this.props.schema}/></Div>
          </Div>
        }

        return <ShapeSchema schema={this.props.schema}/>

      case SCHEMA_TYPE_IDENTIFIER.arrayOf:
        if (typeof this.props.keyName === 'string') {
          return <Div display="flex" flexDirection="column">
            <Div display="flex" flexDirection="row">
              <Div marginRight="10px" css={keyName}>{this.props.keyName}:</Div>
              <Div css={monospace}>ArrayOf</Div>
            </Div>

            <Div marginLeft="20px"><SchemaView schema={this.props.schema._elementType}/></Div>
          </Div>
        }

        return <Div display="flex" flexDirection="column">
          <Div css={monospace}>ArrayOf</Div>
          <Div marginLeft="20px"><SchemaView schema={this.props.schema._elementType}/></Div>
        </Div>

      default:
        throw new Error('invalid schema type identifier')
    }
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
          <SchemaView schema={schema} keyName={key} />
        )
      }
    </div>
  }
}

class SchemaLeaf extends React.Component {
  static displayName = 'SchemaLeaf'
  static propTypes = {
    schemaTypeName: PropTypes.node.isRequired,
  }

  render () {
    return <Div css={monospace}>{ this.props.schemaTypeName }</Div>
  }
}
