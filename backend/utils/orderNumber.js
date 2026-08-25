// ============================================================
// ORDER NUMBER GENERATOR
// ============================================================

function generateOrderNumber() {
    const year = new Date().getFullYear();
    const prefix = 'TMF';
    
    // Generate a unique 6-digit number with timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const unique = timestamp + random;
    
    return `${prefix}-${year}-${unique}`;
}

function isValidOrderNumber(orderNumber) {
    return /^TMF-\d{4}-\d{6,9}$/.test(orderNumber);
}

module.exports = {
    generateOrderNumber,
    isValidOrderNumber
};
