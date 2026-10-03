const API_URL = "http://localhost:3000/api/expenses";
let allExpenses = [];

const spinner = document.getElementById('loading-spinner');
const errorAlert = document.getElementById('error-alert');
const tableBody = document.getElementById('expenses-table-body');
const totalAmountEl = document.getElementById('total-amount');
const expenseCountEl = document.getElementById('expense-count');
const highestAmountEl = document.getElementById('highest-amount');
const highestTitleEl = document.getElementById('highest-title');
const categoryFilter = document.getElementById('category-filter');

const addForm = document.getElementById('add-form');
const addTitle = document.getElementById('add-title');
const addAmount = document.getElementById('add-amount');
const addCategory = document.getElementById('add-category');
const addDate = document.getElementById('add-date');

const editForm = document.getElementById('edit-form');
const editId = document.getElementById('edit-id');
const editTitle = document.getElementById('edit-title');
const editAmount = document.getElementById('edit-amount');
const editCategory = document.getElementById('edit-category');
const editDate = document.getElementById('edit-date');
const editModalInstance = new bootstrap.Modal(document.getElementById('editModal'));

document.addEventListener('DOMContentLoaded', () => { 
    setTodayDate();
    refresh();
});
categoryFilter.addEventListener('change', applyFilter);
addForm.addEventListener('submit', handleAddSubmit);
editForm.addEventListener('submit', handleEditSubmit);
tableBody.addEventListener('click', handleTableClick);

async function getExpenses() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }
    return await response.json();
}

async function addExpense(expenseData) {
    spinner.classList.remove('d-none');
    errorAlert.classList.add('d-none');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Add error:', error);
        errorAlert.textContent = `Failed to add expense: ${error.message}`;
        errorAlert.classList.remove('d-none');
        return false;
    } finally {
        spinner.classList.add('d-none');
    }
}
async function updateExpense(id, expenseData) {
    spinner.classList.remove('d-none');
    errorAlert.classList.add('d-none');
    
    try { const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Edit error:', error);
        errorAlert.textContent = `Failed to edit expense: ${error.message}`;
        errorAlert.classList.remove('d-none');
        return false;
    } finally {
        spinner.classList.add('d-none');
    }
}

async function deleteExpense(id) {
    spinner.classList.remove('d-none');
    errorAlert.classList.add('d-none');

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Delete error:', error);
        errorAlert.textContent = `Failed to delete expense: ${error.message}`;
        errorAlert.classList.remove('d-none');
        return false;
    } finally {
        spinner.classList.add('d-none');
    }
}

async function refresh() {
    spinner.classList.remove('d-none');
    errorAlert.classList.add('d-none');

    try {
        allExpenses = await getExpenses();
        
        renderSummary(allExpenses);
        applyFilter();

    } catch (error) {
        console.error('Fetch error:', error);
        errorAlert.textContent = "Failed to load expenses. Is the server running?";
        errorAlert.classList.remove('d-none');
    } finally {
        spinner.classList.add('d-none');
    }
}

async function handleAddSubmit(e) {
    e.preventDefault();

    const newExpense = {
        title: addTitle.value,
        amount: parseFloat(addAmount.value),
        category: addCategory.value,
        date: addDate.value
    };

    const success = await addExpense(newExpense);

    if (success) {
        addForm.reset();
        setTodayDate();
        refresh();
    }
}

async function handleEditSubmit(e) {
    e.preventDefault();

    const id = editId.value;
    const updatedExpense = {
        title: editTitle.value,
        amount: parseFloat(editAmount.value),
        category: editCategory.value,
        date: editDate.value
    };

    const success = await updateExpense(id, updatedExpense);

    if (success) {
        editModalInstance.hide();
        refresh();
    }
}

async function handleTableClick(e) {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.getAttribute('data-id');
        if (confirm("Are you sure you want to delete this expense?")) {
            const success = await deleteExpense(id);
            if (success) refresh();
        }
    }

    if (e.target.classList.contains('edit-btn')) {
        const id = e.target.getAttribute('data-id');
        const expense = allExpenses.find(exp => exp.id == id);
        
        if (expense) {
            editId.value = expense.id;
            editTitle.value = expense.title;
            editAmount.value = expense.amount;
            editCategory.value = expense.category;
            editDate.value = expense.date;
            
            editModalInstance.show();
        }
    }
}

function renderSummary(list) {
    const total = list.reduce((sum, exp) => sum + exp.amount, 0);
    totalAmountEl.textContent = total.toFixed(2);

    expenseCountEl.textContent = list.length;

    if (list.length > 0) {
        const highest = list.reduce((max, exp) => exp.amount > max.amount ? exp : max, list[0]);
        highestAmountEl.textContent = highest.amount.toFixed(2);
        highestTitleEl.textContent = highest.title;
    } else {
        highestAmountEl.textContent = "0.00";
        highestTitleEl.textContent = "-";
    }
}

function renderTable(list) {
    tableBody.innerHTML = '';

    list.forEach(expense => {
        const tr = document.createElement('tr');
        
        let badgeColor = 'bg-secondary';
        if (expense.category === 'Food') badgeColor = 'bg-success';
        if (expense.category === 'Transport') badgeColor = 'bg-primary';
        if (expense.category === 'Bills') badgeColor = 'bg-warning text-dark';

        tr.innerHTML = `
            <td>${expense.title}</td>
            <td>${expense.amount.toFixed(2)}</td>
            <td><span class="badge ${badgeColor}">${expense.category}</span></td>
            <td>${expense.date}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1 edit-btn" data-id="${expense.id}">Edit</button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${expense.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function applyFilter() {
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === 'All') {
        renderTable(allExpenses);
    } else {
        const filteredList = allExpenses.filter(exp => exp.category === selectedCategory);
        renderTable(filteredList);
    }
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    addDate.value = today;
}

document.addEventListener('DOMContentLoaded', () => {
  const htmlElement = document.documentElement;
  const themeButtons = document.querySelectorAll('[data-bs-theme-value]');
  const activeIcon = document.querySelector('.theme-icon-active');

  const iconMap = {
    light: 'bi-sun-fill',
    dark: 'bi-moon-stars-fill'
  };

  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedTheme = button.getAttribute('data-bs-theme-value');
      setTheme(selectedTheme);
    });
  });

  function setTheme(theme) {
    htmlElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (activeIcon && iconMap[theme]) {
      activeIcon.className = `bi ${iconMap[theme]} theme-icon-active`;
    }
  }
});
