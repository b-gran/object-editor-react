import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames';

import Table, {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from 'material-ui/Table';
import Checkbox from 'material-ui/Checkbox';
import { InfoOutline } from 'material-ui-icons'

import { Div } from 'glamorous'
import * as glamor from 'glamor'

import { BaseClassnames, PropTypes as Props } from './constants';

import * as Schema from './Schema';
import SchemaView from './SchemaView'
import { HoverPopover } from './HoverPopover'

// Base propTypes for all editor variants
export const BASE_EDITOR_PROPTYPES = {
  // Schema for the elements in the array
  // TODO: add "render" functions to type somehow, so that an element can provide a custom
  // TODO: render function for any of its cells
  // TODO: pass validation functions through schema
  type: Props.Schema.isRequired,

  // Optional: classes to apply to the editor wrapper
  className: PropTypes.string,
};

// Returns true if `schemaType` is one of the array types -- "array", or "arrayOf".
const isArraySchemaType = schemaType => {
  return schemaType._type && schemaType._type.match(/array/) !== null;
};


function columnTitle (schemaType) {
  // Complex object schema
  if (typeof schemaType === 'object') {
    return 'Object';
  }

  // If it's an array type, use the elementType property.
  if (isArraySchemaType(schemaType)) {
    return 'Array of ' + columnTitle(schemaType._elementType || Schema.SchemaTypes.any);
  }

  // Otherwise, just use the _type field.
  return _.capitalize(schemaType._type);
}

// Returns the column title for the SchemaType `schemaType`.
// A <th /> Element with a the class ".editor__column-title"
class ColumnTitle extends React.Component {
  static displayName = 'ColumnTitle'
  static propTypes = {
    // Optional extra classes for the <th />
    className: PropTypes.string,

    // Children of the <th />
    children: PropTypes.node,

    schema: Props.Schema.isRequired,
  }

  render () {
    const classes = cx(
      BaseClassnames.ColumnTitle(),
      this.props.className
    )

    const popoverContent = (
      <Div padding="15px">
        <SchemaView schema={this.props.schema}/>
      </Div>
    )

    return (
      <TableCell className={classes}>
        <HoverPopover hoverDurationMs={300} popoverContent={popoverContent}>
          <Div display="flex" cursor="default">
            <Div marginRight="5px">{ this.props.children }</Div>
            <InfoOutline style={infoOutlineFontSize} />
          </Div>
        </HoverPopover>
      </TableCell>
    )
  }
}

const infoOutlineFontSize = { fontSize: '16px' }

export default class BaseTable extends React.Component {
  static displayName = 'BaseTable';

  static propTypes = {
    ...BASE_EDITOR_PROPTYPES,

    // The thing to edit
    // Can be anything for a base editor (which doesn't actually render an editor)
    object: PropTypes.any,

    // Handler called when the "select all/none" checkbox is clicked.
    // If the handler isn't provided, the checkbox isn't rendered.
    onSelectAll: PropTypes.func,

    // State of the select all button
    checked: PropTypes.bool,
    indeterminate: PropTypes.bool,

    // State of the table's pagination
    totalElements: PropTypes.number,
    rowsPerPage: PropTypes.number,
    page: PropTypes.number,

    onChangePage: PropTypes.func,
    onChangeRowsPerPage: PropTypes.func,
  };

  // Render the column titles based on a primitive schema type.
  renderPrimitiveColumns = () => {
    return <ColumnTitle schema={this.props.type}>
      {columnTitle(this.props.type)}
    </ColumnTitle>;
  };

  // Render column titles based on a complex object-schema
  renderObjectColumns = () => {
    // A column for each element key
    return Object.keys(this.props.type).map(
      field => (
        <ColumnTitle key={field} schema={this.props.type[field]}>
          {field}
        </ColumnTitle>
      )
    );
  };

  render () {
    const isPrimitiveSchema = Boolean(this.props.type._isSchemaType);

    // Used to render the footer for array schemas
    const numberColumns = 2 + Object.keys(this.props.type).length

    return (
      <Table className={cx(BaseClassnames.Editor(), this.props.className)}>
        <TableHead>
          <TableRow className={BaseClassnames.ColumnTitles()}>
            <TableCell padding="checkbox">
              {
                this.props.onSelectAll &&
                <Checkbox checked={this.props.checked} indeterminate={this.props.indeterminate} onChange={this.props.onSelectAll}/>
              }
            </TableCell>

            {
              isPrimitiveSchema
                ? this.renderPrimitiveColumns()
                : this.renderObjectColumns()
            }

            <TableCell>
              {/* Blank -- just for spacing */}
              {/* This is the delete object column */}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {this.props.children}
        </TableBody>

        {
          this.props.onSelectAll &&
          <TableFooter>
            <TableRow>
              <TablePagination
                colSpan={numberColumns}
                count={this.props.totalElements}
                rowsPerPage={this.props.rowsPerPage}
                page={this.props.page}
                onChangePage={this.props.onChangePage}
                onChangeRowsPerPage={this.props.onChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        }
      </Table>
    );
  }
}

