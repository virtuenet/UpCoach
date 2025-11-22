#!/bin/bash

# Script to install export dependencies for Financial Dashboard
echo "Installing export dependencies for Financial Dashboard..."

# Install ExcelJS for Excel export functionality
echo "Installing ExcelJS..."
npm install exceljs

# Install Puppeteer for PDF generation
echo "Installing Puppeteer..."
npm install puppeteer

# Install TypeScript types for Puppeteer
echo "Installing Puppeteer types..."
npm install --save-dev @types/puppeteer

echo "Export dependencies installation completed!"
echo ""
echo "Installed packages:"
echo "- exceljs: For Excel file generation"
echo "- puppeteer: For PDF generation via headless Chrome"
echo "- @types/puppeteer: TypeScript type definitions"
echo ""
echo "The Financial Dashboard export functionality is now ready to use!"