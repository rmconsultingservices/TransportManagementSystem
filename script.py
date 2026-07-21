import re

with open('TransportApp/Frontend/src/pages/PhysicalInventoryResults.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the input rendering
td_block = """                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={detail.realStock === undefined ? '' : detail.realStock}
                              onChange={(e) => handleStockChange(detail.sparePartId, e.target.value)}
                              className="w-24 text-right bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-md p-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-indigo-700 dark:text-indigo-300"
                              placeholder="-"
                            />
                          )}"""

new_td_block = """                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">{detail.sparePart?.unitOfMeasure?.abbreviation || 'UND'}:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={detail.realStock === undefined ? '' : detail.realStock}
                                  onChange={(e) => handleStockChange(detail.sparePartId, e.target.value)}
                                  className="w-20 text-right bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded p-1 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-700 dark:text-indigo-300"
                                  placeholder="-"
                                />
                              </div>
                              <div className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded mt-1 border border-indigo-100 dark:border-indigo-800">
                                Total: {detail.realStock !== undefined ? detail.realStock : '-'} {detail.sparePart?.unitOfMeasure?.abbreviation || 'UND'}
                              </div>
                            </>
                          )}"""

content = content.replace(td_block, new_td_block)

with open('TransportApp/Frontend/src/pages/PhysicalInventoryResults.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
