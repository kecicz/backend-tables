# Backend Tables
A plugin for Simple Datatables, that enables backend pagination, sorting, filtering and searching of your datatable.

## Install
Just import backend tables plugin after Simple Datatables
```ecmascript 6
import {DataTable} from "simple-datatables"
import "backend-tables"
```

## Usage
To use the plugin, you need to enable it on datatable init
```ecmascript 6
const myTable = new DataTable(tableElement, {
  plugins: {
    backendTables: {
      enabled: true,
      baseUrl: '/datatable_body.json',
      filterable: true,
      filterElems: filterButtons,
      searchInput: searchInput,
      clearSearchButton: resetSearch
    }
  },
  sortable: true,
  searchable: true,
  perPage: 20,
  perPageSelect: [20, 40, 60, 80, 100],
});
```
The plugin overrides default sortable and searchable options with own functionality.

## Backend
The plugin expects the server to send JSON with an array, where each element of the array corresponds to one row of the table.
The request to the backend has the following parameters:

| name | description |
| ---- | ----------- |
| offset  | offset for data load |
| limit  | hown many rows to load |
| term  | search term |
| sort  | name of the column used for sorting |
| direction  | sort direction |
| filter  | name of the active filter |

The response should be in the following format
```json
{
  "data": [
    {
      "col1": "Hello",
      "col2": "World!"
    },
    {
      "col1": "<strong>You can also use HTML!</strong>",
      "col2": ""
    }
  ],
  "total_count": 1234
}
```
In `total_count`, backend tables expect you to define the number of total records for currently active filters and search query. This is used for generating page index.

## Sorting
In order to use sorting with Backend Tables, you need to define multiple properties on columns
```html
<table>
    <thead>
        <tr>
            <th data-sort-enabled="true" data-sort-name="id">
                ID
            </th>
            <th>
                Unsortable column
            </th>
            <th data-sort-enabled="true" data-sort-name="user" data-sort-default="desc">
                Username (sort by default)
            </th>
        </tr>
    </thead>
</table>
```
`data-sort-name` is used to define what column is currently used for sorting and will be sent to backend as parameter `sort`

`data-sort-default` is used to define the default column and direction, used for sorting

## Filtering
If you want to use filters with backend tables, you need to create a set of links, used for different filter options
```html
<a href="#" class="table-filter" data-filter="all">Reset</a>
<a href="#" class="table-filter" data-filter="new">New users</a>
<a href="#" class="table-filter" data-filter="old">Old users</a>
```
`data-filter` property is then sent to backend as parameter `filter`

The list with filter elements is passed to Backend Tables on init using the `filterElems` option

## Searching
Easiest way is to enable backend search is to simply enable simple datatables own searchable option.

If you want to use custom search input with your table, you can create your own text input, that will be used for backend searching. This input is then passed over to the Backend Tables using the `searchInput` option. You can also pass over a button, used to clear the search query.

## Styling your table
Because data are loaded to the table asynchronously, styling table rows is not that easy. Therefore, Backend Tables let you pass any attributes to elements in each column using `data-element` attributes of a column header.

For example, if you need to add a class to each `<td>` element of some column of your table. You can simply define this attribute on the column header as

```html
<th data-element-class="center">Column name</th>
```
Each element in this collumn will then have class 'center' defined on it. 
