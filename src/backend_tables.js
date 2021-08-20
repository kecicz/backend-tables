export function initPlugin(dataTable) {
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
          this.defaultSearch = this.searchInput == null;
        }
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
        const keepSearchFocus = (document.activeElement === this.searchInput);
        this.tableInstance.destroy();
        if (this.sortable) {
          this.initSortButtons();
        }
        this.tableInstance.init({
          ajax: this.loadTableData(this.dataTableFilter, this.dataTablePage, this.dataTablePageSize, this.dataTableSearch, this.dataTableSort, this.dataTableDirection)
        })
        if (this.searchable && this.defaultSearch) {
          this.replaceVanillaSearch();
          if (keepSearchFocus) {
            this.searchInput.focus();
          }
        }
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

      replaceVanillaSearch() {
        const origSearch = this.tableInstance.wrapper.querySelector('.dataTable-search input');
        if (this.searchInput == null) {
          this.searchInput = origSearch.cloneNode(true);
        }
        origSearch.parentNode.replaceChild(this.searchInput, origSearch);
      }

      initSearchInput() {
        if (this.defaultSearch) {
          this.replaceVanillaSearch();
        }

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

      passCustomStylesToElems() {
        const elemAttrReg = /^data\-element\-(.+)$/;
        this.tableInstance.container.querySelector('tbody').querySelectorAll('tr').forEach(tr => {
          this.tableInstance.headings.forEach((th, colIdx) => {
            for (let i = 0; i < th.attributes.length; i++) {
              const attr = th.attributes[i];
              const match = attr.nodeName.match(elemAttrReg);
              if (match != null) {
                const key = match[1];
                if (key != null) {
                  tr.querySelectorAll('td')[colIdx].setAttribute(key, attr.nodeValue);
                }
              }
            }
          });
        });
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
          'searchable': this.searchable === true && this.defaultSearch ? true : false, // prevent sneaky undefines and other nasty JS stuff
          'fixedColumns': false,
          ajax: this.loadTableData(this.dataTableFilter, this.dataTablePage, this.dataTablePageSize, this.dataTableSearch, this.dataTableSort, this.dataTableDirection)
        })
        this.tableInstance.on('datatable.page', page => {
          if (parseInt(page) === this.dataTablePage) return;

          this.dataTablePage = parseInt(page);
          this.changeTablePage();
        });

        this.tableInstance.on('datatable.perpage', pageSize => {
          const newSize = parseInt(pageSize);
          this.dataTablePage = Math.floor(((this.dataTablePage - 1) * this.dataTablePageSize / newSize)) + 1;
          this.dataTablePageSize = newSize;
          this.changeTablePage();
        });

        // Callback after data is loaded
        this.tableInstance.on('datatable.init', () => {
          if (this.sortable) {
            this.tableInstance.headings.forEach(th => {
              if (th.dataset.sortName === this.dataTableSort) {
                th.classList.add(this.dataTableDirection);
              }
            });

            this.tableInstance.header.querySelectorAll('.dataTable-backendSorter').forEach(sorter => {
              sorter.addEventListener('click', e => {
                e.preventDefault();
                const target = e.target.closest('th');
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

        this.tableInstance.on('datatable.update', () => {
          if(this.tableInstance.data.length > 0) {
            this.passCustomStylesToElems();
          }
        });

        if (this.searchable) {
          this.initSearchInput();
        }
      }
    }

    return new BackendTables(this);
  })
}
