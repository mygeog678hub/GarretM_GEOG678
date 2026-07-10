// ================= EMPLOYEE SERVICE =================

let employees = [];
let currentEmployee = null;

/**
 * Replace the current employee cache.
 */
export function setEmployees(employeeList) {
  employees = employeeList || [];
}

/**
 * Get all employees.
 */
export function getEmployees() {
  return employees;
}

/**
 * Find employee by ID.
 */
export function getEmployeeById(id) {
  return employees.find(emp => emp.id === id);
}

/**
 * Store the current employee.
 */
export function setCurrentEmployee(employee) {
  currentEmployee = employee;
}

/**
 * Get the logged-in employee.
 */
export function getCurrentEmployee() {
  return currentEmployee;
}