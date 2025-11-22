console.log("main.js loaded!");

document.querySelectorAll('.skill-exp').forEach(exp => {
    const year = parseInt(exp.getAttribute('data-start-year'));
    const month = parseInt(exp.getAttribute('data-start-month'));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const totalMonths = (currentYear - year) * 12 + (currentMonth - month);
    const rawYears = totalMonths / 12;

    const roundedYears = Math.round(rawYears * 2) / 2;

    exp.textContent = `${roundedYears} years`;
});
