function initPlugin(dataTable) {
  dataTable.extend('backendTables', function (options) {
    class BackendTables {
      constructor(tableInstance) {
        this.tableInstance = tableInstance;
        this.baseUrl = options.baseUrl;
        this.sortable = this.tableInstance.options.sortable;
        this.filterable = options.filterable;
        this.filterElems = options.filterElems;
        this.searchable = this.tableInstance.options.searchable;
        this.searchInput = options.searchInput;
        this.clearSearchButton = options.clearSearchButton;
        this.dataTablePage = 1;
        this.dataTablePageSize = this.tableInstance.options.perPage;
        if (this.filterable) {
          this.dataTableFilter = 'all';
        }
        if (this.searchable) {
          this.dataTableSearch = '';
        }
        console.log(this);
      }

      sortTable() {
        this.reinitDataTable();
        this.tableInstance.page(this.dataTablePage);
      }

      changeTablePage() {
        this.reinitDataTable();
        this.tableInstance.page(this.dataTablePage);
      }

      loadTableData(filter, page, pageSize, search, sortColumn, sortDirection) {
        if (typeof (filter) === 'undefined') filter = '';
        if (typeof (page) === 'undefined') page = '';
        if (typeof (pageSize) === 'undefined') pageSize = '';
        if (typeof (search) === 'undefined') search = '';
        if (typeof (sortColumn) === 'undefined') sortColumn = '';
        if (typeof (sortDirection) === 'undefined') sortDirection = '';
        let url = `${this.baseUrl}?offset=${(page - 1) * pageSize}&limit=${pageSize}`
        if (this.searchable) {
          url += `&term=${encodeURIComponent(search)}`
        }
        if (this.sortable) {
          url += `&sort=${sortColumn}&direction=${sortDirection}`
        }
        if (this.filterable) {
          url += `&filter=${filter}`
        }
        return {
          url: url,
          load: function (xhr) {
            let data = JSON.parse(xhr.responseText);
            const prependSize = (page - 1) * pageSize;
            const appendSize = data.total_count - (data.data.length + prependSize);
            [...Array(prependSize).keys()].forEach(i => {
              data.data.unshift({
                foo: ''
              })
            });
            [...Array(appendSize).keys()].forEach(i => {
              data.data.push({
                foo: ''
              })
            });
            return JSON.stringify(data.data);
          }
        }
      }

      initSortButtons(firstTime = false) {
        this.tableInstance.table.querySelector('thead').querySelectorAll('th').forEach(elem => {
          if (elem.dataset.sortEnabled != null) {
            const text = elem.innerHTML;
            const sorter = document.createElement('a');
            sorter.classList.add('dataTable-backendSorter');
            sorter.href = '#';
            if (elem.dataset.sortDefault != null && firstTime) {
              if (['asc', 'desc'].includes(elem.dataset.sortDefault)) {
                this.dataTableDirection = elem.dataset.sortDefault;
              } else {
                this.dataTableDirection = 'asc';
              }
              this.dataTableSort = elem.dataset.sortName;
            }
            elem.innerHTML = '';
            sorter.innerHTML = text;
            elem.appendChild(sorter);
          }
        });
      }

      reinitDataTable() {
        this.tableInstance.destroy();
        if (this.sortable) {
          this.initSortButtons();
        }
        this.tableInstance.init({
          ajax: this.loadTableData(this.dataTableFilter, this.dataTablePage, this.dataTablePageSize, this.dataTableSearch, this.dataTableSort, this.dataTableDirection)
        })
      }

      initFilters() {
        this.filterElems.forEach(filterElem => {
          filterElem.addEventListener('click', e => {
            e.preventDefault();
            const target = e.target.closest('a');
            const filter = target.dataset.filter;
            this.dataTablePage = 1;
            this.dataTableFilter = filter;
            this.reinitDataTable();
          });
        });
      }

      initSearchInput() {
        const typingTimeoutTime = 500;
        let typingTimer;

        const searchTable = () => {
          if (this.searchInput.value.length >= 3) {
            this.dataTableSearch = this.searchInput.value;
            this.dataTablePage = 1;
            this.reinitDataTable();
          } else if (!this.searchInput.value.length) {
            this.dataTableSearch = '';
            this.dataTablePage = 1;
            this.reinitDataTable();
          }
        }

        this.searchInput.addEventListener('keyup', () => {
          clearTimeout(typingTimer);
          typingTimer = setTimeout(searchTable, typingTimeoutTime);
        });

        this.searchInput.addEventListener('keydown', () => {
          clearTimeout(typingTimer);
        })

        if (this.clearSearchButton != null) {
          this.clearSearchButton.addEventListener('click', e => {
            e.preventDefault();
            this.searchInput.value = '';
            searchTable();
          });
        }
      }

      init() {
        if (this.filterable) {
          this.initFilters();
        }
        this.tableInstance.destroy();
        if (this.sortable) {
          this.initSortButtons(true);
        }
        this.tableInstance.init({
          'sortable': false,
          'searchable': false,
          'fixedColumns': false,
          ajax: this.loadTableData(this.dataTableFilter, this.dataTablePage, this.dataTablePageSize, this.dataTableSearch, this.dataTableSort, this.dataTableDirection)
        })
        this.tableInstance.on('datatable.page', page => {
          if (parseInt(page) === this.dataTablePage) return;

          this.dataTablePage = parseInt(page);
          this.changeTablePage();
        });

        this.tableInstance.on('datatable.perpage', pageSize => {
          this.dataTablePageSize = parseInt(pageSize);
          this.dataTablePage = Math.floor(((this.dataTablePage - 1) * this.dataTablePageSize / this.dataTablePageSize)) + 1;
          this.changeTablePage();
        });

        // Callback after data is loaded
        this.tableInstance.on('datatable.init', () => {
          if (this.sortable) {
            this.tableInstance.header.querySelectorAll('th').forEach(th => {
              if (th.dataset.sortName === this.dataTableSort) {
                th.classList.add(this.dataTableDirection);
              }
            });

            this.tableInstance.header.querySelectorAll('.dataTable-backendSorter').forEach(sorter => {
              sorter.addEventListener('click', e => {
                e.preventDefault();
                const target = e.target.closest('th');
                console.log(target);
                let direction;
                if (target.classList.contains('asc')) {
                  direction = 'desc';
                } else {
                  direction = 'asc';
                }
                this.dataTableSort = target.dataset.sortName;
                this.dataTableDirection = direction;
                this.sortTable();
              });
            })
          }
        });

        if (this.searchInput != null && this.searchable) {
          this.initSearchInput();
        }
      }
    }

    return new BackendTables(this);
  })
}

try {
  exports.initPlugin = initPlugin;
}catch(ex){
  console.error(`Error exporting initPlugin: ${ex.toString()}`);
}
