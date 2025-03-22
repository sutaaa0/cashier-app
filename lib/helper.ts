/**
 * Groups an array of objects by a specified key
 * @param array The array to group
 * @param key The property name to group by
 * @returns An object with keys representing each group value and values containing arrays of matching objects
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result: Record<string, T[]>, currentItem: T) => {
      const groupKey = String(currentItem[key]);
      
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      
      result[groupKey].push(currentItem);
      return result;
    }, {});
  }
  
  /**
   * Calculates the average value of a specified numeric property across an array of objects
   * @param array The array of objects
   * @param key The property name (must contain numeric values)
   * @returns The average value
   */
  export function calculateAverage<T>(array: T[], key: keyof T): number {
    if (array.length === 0) return 0;
    
    const sum = array.reduce((total, item) => {
      // Ensure the property is a number
      const value = Number(item[key]);
      return isNaN(value) ? total : total + value;
    }, 0);
    
    return sum / array.length;
  }