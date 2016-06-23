var _ = require('lodash')

module.exports = function (squel) {
  squel = squel || require('squel')
  var builder = new squel.cls.QueryBuilder()
  return {
    to_values: function (values) {
      return builder._formatValueForQueryString(values)
    },
    to_value: function (value) {
      return builder._formatValueForQueryString(value)
    },
		// Input: seuqelize model
    to_columns_of_model: function (model, options) {
      var self = this
      var columns = []
      var table_name = model.getTableName()
      Object.keys(model.attributes).forEach(function (attribute) {
        if (!options || !options.exclude || options.exclude.indexOf(attribute) === -1) {
          columns.push(self.to_column(table_name + '.' + attribute))
        }
      })
      return columns.join(', ')
    },
    to_columns: function (attributes) {
      if (!attributes || !Array.isArray(attributes)) {
        throw new Error('attributes must be an array')
      }
      return attributes.map(this.to_column).join(', ')
    },
    to_column: function (attribute) {
      return builder._formatFieldName(attribute)
    },
    to_update_string: function (update_object) {
      if (!update_object || !_.isObject(update_object)) {
        throw new Error('update_object must be an object')
      }
      var columns = this.to_columns(Object.keys(update_object))
      var values = this.to_values(_.values(update_object))
      return '(' + columns + ') = ' + values
    },
    to_multi_condition_update: function (bulk) {
      var self = this
      var table_name = bulk.table_name
      var updates = bulk.updates
      var attributes_to_set = {}
      var conditions = updates.map(function (update) { return update.where })

      updates.forEach(function (update) {
        Object.keys(update.set).forEach(function (attribute) {
          attributes_to_set[attribute] = attributes_to_set[attribute] || []
          attributes_to_set[attribute].push({
            value: update.set[attribute],
            conditions: update.where
          })
        })
      })
      var sql_query = 'UPDATE ' + table_name + '\n'
      sql_query += '  SET '
      sql_query += Object.keys(attributes_to_set).map(function (attribute) {
        var attribute_to_set_clause = self.to_column(attribute) + ' = CASE\n'
        attributes_to_set[attribute].forEach(function (obj) {
          attribute_to_set_clause += '    WHEN ' + self.to_condition(obj.conditions) + ' THEN ' + self.to_value(obj.value) + '\n'
        })
        attribute_to_set_clause += '  END'
        return attribute_to_set_clause
      }).join(',\n') + '\n'
      sql_query += 'WHERE ' + self.to_conditions(conditions)
      return sql_query
    },
    to_conditions: function (conditions) {
      var self = this
      if (!conditions || !Array.isArray(conditions)) {
        throw new Error('conditions must be an array')
      }
      var expr = squel.expr()
      conditions.forEach(function (condition) {
        expr.or(self.to_condition(condition))
      })
      return '(' + expr.toString() + ')'
    },
    to_condition: function (condition) {
      if (!condition || !_.isObject(condition)) {
        throw new Error('condition must be an object')
      }
      var expr = squel.expr('hello')
      Object.keys(condition).forEach(function (key) {
        expr.and(builder._formatFieldName(key) + ' = ?', condition[key])
      })
      return '(' + expr.toString() + ')'
    }
  }
}
