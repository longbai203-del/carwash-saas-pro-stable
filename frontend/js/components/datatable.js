/**
 * components/datatable.js - 数据表格组件
 */
window.DataTableComponent = {
    _instances: {},

    create: function(options) {
        var id = options.id;
        var columns = options.columns || [];
        var data = options.data || [];
        var actions = options.actions || null;
        var pageSize = options.pageSize || 20;
        var searchable = options.searchable !== undefined ? options.searchable : true;
        var container = document.getElementById(id);
        if (!container) return null;

        var html = '';
        if (searchable) {
            html += '<div class="flex gap-3 mb-4 flex-wrap"><input type="text" id="' + id + '_search" placeholder="搜索..." class="p-2 border rounded-lg text-sm flex-1 min-w-[150px]" oninput="DataTableComponent.filter(\'' + id + '\')"><span class="text-sm text-gray-400 self-center" id="' + id + '_count">共 ' + data.length + ' 条</span></div>';
        }
        html += '<div class="overflow-x-auto"><table class="w-full text-sm" id="' + id + '_table"><thead><tr class="border-b bg-gray-50">';
        columns.forEach(function(col) {
            html += '<th class="p-2 text-right">' + col.label + '</th>';
        });
        if (actions) html += '<th class="p-2 text-right">操作</th>';
        html += '</tr></thead><tbody id="' + id + '_body"></tbody></table></div>';

        if (data.length > pageSize) {
            html += '<div class="flex justify-between items-center mt-3 text-sm text-gray-500" id="' + id + '_pagination"><span id="' + id + '_page_info">第 1 / ' + Math.ceil(data.length / pageSize) + ' 页</span><div class="flex gap-2"><button onclick="DataTableComponent.prevPage(\'' + id + '\')" class="px-3 py-1 border rounded hover:bg-gray-50">上一页</button><button onclick="DataTableComponent.nextPage(\'' + id + '\')" class="px-3 py-1 border rounded hover:bg-gray-50">下一页</button></div></div>';
        }

        container.innerHTML = html;

        this._instances[id] = { columns: columns, data: data, actions: actions, pageSize: pageSize, filteredData: data, currentPage: 1 };
        this._render(id);
        return this._instances[id];
    },

    _render: function(id) {
        var instance = this._instances[id];
        if (!instance) return;
        var columns = instance.columns;
        var actions = instance.actions;
        var pageSize = instance.pageSize;
        var data = instance.filteredData || [];
        var currentPage = instance.currentPage || 1;
        var start = (currentPage - 1) * pageSize;
        var end = Math.min(start + pageSize, data.length);
        var pageData = data.slice(start, end);
        var totalPages = Math.ceil(data.length / pageSize) || 1;

        var tbody = document.getElementById(id + '_body');
        if (!tbody) return;
        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100" class="p-4 text-center text-gray-400">暂无数据</td></tr>';
            return;
        }

        var html = '';
        pageData.forEach(function(row, index) {
            html += '<tr class="border-b hover:bg-gray-50">';
            columns.forEach(function(col) {
                var value = row[col.key] !== undefined ? row[col.key] : '';
                html += '<td class="p-2">' + (col.format ? col.format(value, row) : value) + '</td>';
            });
            if (actions) {
                html += '<td class="p-2">' + actions(row, index) + '</td>';
            }
            html += '</tr>';
        });
        tbody.innerHTML = html;

        var pageInfo = document.getElementById(id + '_page_info');
        if (pageInfo) pageInfo.textContent = '第 ' + currentPage + ' / ' + totalPages + ' 页';
        var countEl = document.getElementById(id + '_count');
        if (countEl) countEl.textContent = '共 ' + data.length + ' 条';
    },

    filter: function(id) {
        var instance = this._instances[id];
        if (!instance) return;
        var searchInput = document.getElementById(id + '_search');
        var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (!keyword) {
            instance.filteredData = instance.data;
        } else {
            instance.filteredData = instance.data.filter(function(row) {
                var values = Object.values(row);
                for (var i = 0; i < values.length; i++) {
                    if (String(values[i]).toLowerCase().indexOf(keyword) !== -1) return true;
                }
                return false;
            });
        }
        instance.currentPage = 1;
        this._render(id);
    },

    prevPage: function(id) {
        var instance = this._instances[id];
        if (!instance || instance.currentPage <= 1) return;
        instance.currentPage--;
        this._render(id);
    },

    nextPage: function(id) {
        var instance = this._instances[id];
        if (!instance) return;
        var totalPages = Math.ceil((instance.filteredData || []).length / instance.pageSize) || 1;
        if (instance.currentPage >= totalPages) return;
        instance.currentPage++;
        this._render(id);
    },

    refresh: function(id, newData) {
        var instance = this._instances[id];
        if (!instance) return;
        instance.data = newData || instance.data;
        instance.filteredData = instance.data;
        instance.currentPage = 1;
        this._render(id);
    },

    destroy: function(id) {
        var container = document.getElementById(id);
        if (container) container.innerHTML = '';
        delete this._instances[id];
    }
};
console.log('[DataTableComponent] 加载完成');