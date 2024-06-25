const getIST = () => {
    const options = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    return new Date().toLocaleString('en-US', options);
}

module.exports = getIST;