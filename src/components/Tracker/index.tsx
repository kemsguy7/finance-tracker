
import React, { useState, useEffect } from 'react';
import { PlusCircle,   Trash2,  ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';


interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

const defaultCategories: Category[] = [
  { id: '1', name: 'Salary', type: 'income' },
  { id: '2', name: 'Freelance', type: 'income' },
  { id: '3', name: 'Food', type: 'expense' },
  { id: '4', name: 'Transport', type: 'expense' },
  { id: '5', name: 'Utilities', type: 'expense' },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

const FinanceTracker = () => {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' as 'income' | 'expense' });

  // Form state
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    type: 'expense',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Load data from localStorage
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    const savedCategories = localStorage.getItem('categories');
    
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [transactions, categories]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      ...formData,
      id: Date.now().toString(),
    };
    setTransactions([...transactions, newTransaction]);
    setShowForm(false);
    setFormData({
      type: 'expense',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // Add new category
  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const newCat: Category = {
        id: Date.now().toString(),
        name: newCategory.name.trim(),
        type: newCategory.type,
      };
      setCategories([...categories, newCat]);
      setNewCategory({ name: '', type: 'expense' });
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => filterCategory === 'all' || t.category === filterCategory)
    .filter(t => {
      if (!dateRange.start || !dateRange.end) return true;
      const transactionDate = new Date(t.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return transactionDate >= start && transactionDate <= end;
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortField === 'category') {
        return sortOrder === 'asc'
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      }
      return 0;
    });

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Prepare chart data
  const chartData = transactions.reduce((acc: any[], transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('en-NG');
    const existingDay = acc.find(item => item.date === date);
    
    if (existingDay) {
      if (transaction.type === 'income') {
        existingDay.income += transaction.amount;
      } else {
        existingDay.expenses += transaction.amount;
      }
    } else {
      acc.push({
        date,
        income: transaction.type === 'income' ? transaction.amount : 0,
        expenses: transaction.type === 'expense' ? transaction.amount : 0,
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Category data for pie chart
  const categoryData = transactions
    .reduce((acc: any[], transaction) => {
      const existingCategory = acc.find(item => item.name === transaction.category);
      if (existingCategory) {
        existingCategory.value += transaction.amount;
      } else {
        acc.push({
          name: transaction.category,
          value: transaction.amount,
          type: transaction.type
        });
      }
      return acc;
    }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-inter">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Personal Finance Tracker</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-green-800">Total Income</h2>
                  <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalIncome)}</p>
                </div>
                <ArrowUpCircle className="text-green-500 h-8 w-8" />
              </div>
            </div>
            <div className="bg-red-50 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-red-800">Total Expenses</h2>
                  <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalExpenses)}</p>
                </div>
                <ArrowDownCircle className="text-red-500 h-8 w-8" />
              </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-blue-800">Balance</h2>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalIncome - totalExpenses)}</p>
                </div>
                <Wallet className="text-blue-500 h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Income vs Expenses Trend</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value).slice(0, -3)}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10B981" 
                    name="Income"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#EF4444" 
                    name="Expenses"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Category Distribution</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'income' ? '#10B981' : '#EF4444'} 
                        opacity={0.8}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle size={20} />
              Add Transaction
            </button>
            
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="category">Sort by Category</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>

            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End Date"
            />
          </div>

          <div className="mt-4 flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
  
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
  
          {/* Transaction Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount (₦)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories
                        .filter(cat => cat.type === formData.type)
                        .map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))
                      }
                    </select>
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
  
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Transaction
                  </button>
                </div>
              </form>
            </div>
          )}
  
          {/* Category Management */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Categories</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="New category name"
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'income' | 'expense' })}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <button
                onClick={handleAddCategory}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Category
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Income Categories</h3>
                <div className="space-y-2">
                  {categories.filter(cat => cat.type === 'income').map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded-lg">
                      <span className="flex-grow">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Expense Categories</h3>
                <div className="space-y-2">
                  {categories.filter(cat => cat.type === 'expense').map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 text-sm bg-red-50 p-2 rounded-lg">
                      <span className="flex-grow">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
  
          {/* Transactions List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Transactions</h2>
            {filteredAndSortedTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found. Add some transactions to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 bg-gray-50">Date</th>
                      <th className="text-left py-3 px-4 bg-gray-50">Type</th>
                      <th className="text-left py-3 px-4 bg-gray-50">Category</th>
                      <th className="text-left py-3 px-4 bg-gray-50">Amount</th>
                      <th className="text-left py-3 px-4 bg-gray-50">Notes</th>
                      <th className="text-right py-3 px-4 bg-gray-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          {new Date(transaction.date).toLocaleDateString('en-NG')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'income'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">{transaction.category}</td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              transaction.type === 'income'
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                            }
                          >
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600 text-sm">
                            {transaction.notes || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
  
          {/* Export Data Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(transactions, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'finance-tracker-data.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default FinanceTracker;