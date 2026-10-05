#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

async function getFileData(fileName) {
  const data = await readFile(fileName, 'utf8');
  return JSON.parse(data);
}

function isValidCommand(command) {
  const validCommands = ['total', 'by-category', 'by-date', 'over', 'search', 'recent'];
  return validCommands.includes(command);
}

function isValidArg(command, argument) {
  if (command === 'over' && !/^[0-9]+(\.?[0-9]+)?$/.test(argument)) return false;
  if (command === 'search' && !argument) return false;
  return true;
}

async function app() { 
  const [fileName, command, argument] = process.argv.slice(2);
  if (!fileName) {
    console.error('Error: No filename given');
    return;
  }
  if (!isValidCommand(command)) {
    console.error('Error: Invalid command');
    return;
  }

  if (!isValidArg(command, argument)) {
    console.error(`Error: Invalid argument for ${command}`);
    return;
  } 
  
  try {
    const data = await getFileData(fileName);
    let result;
    switch (command) {
      case 'total':
        result = total(data);
        console.log(`The total amount is $${result.toFixed(2)}`);
        return;
      case 'by-category':
        result = byCategory(data);
        formatByCategory(result);
        return;
      case 'by-date':
        result = byDate(data);
        formatExpenses(result);
        return;
      case 'over':
        result = over(data, argument);
        formatExpenses(result);
        return;
      case 'search':
        result = search(data, argument);
        formatExpenses(result);
        return;
      default:
        return;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Error: This file could not be found.');
    } else if (error.code === 'EACCES') {
      console.error('Error: Permission denied.');
    } else if (error instanceof SyntaxError) {
      console.error(`Error: ${error.message}`)
    } else {
      console.error('An unexpected error occurred:', error.message);
    }
  } 
}

function formatByCategory(data) {
  Object.entries(data).forEach(category => {
    console.log(`${category[0]}: \n`);
    formatExpenses(category[1]);
  });
  console.log();
}

function formatExpenses(expenses) {
  expenses.forEach(({id, description, amount, category, date}) => {
    console.log(`id: ${id} 
description: ${description}
amount: $${amount}
category: ${category}
date: ${date}\n`);
  });
}

function search(data, term) {
  term = term.toLowerCase();
  return data.filter((expense) => {
    return expense.description.toLowerCase().includes(term);
  });
}

function over(data, amount) {
  return data.filter(expense => expense.amount > amount);
}

function total(data) {
  return data.reduce((sum, curr) => sum + curr.amount, 0);
}

function byCategory(data) {
  return Object.groupBy(data, ({category}) => category);
}

function byDate(data) {
  return data.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
}

await app();