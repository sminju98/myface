async function loadComponent(url, targetId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const html = await response.text();
        document.getElementById(targetId).innerHTML = html;
    } catch (error) {
        console.error('Error loading component:', url, error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('header')) {
        loadComponent('header.html', 'header');
    }
    if (document.getElementById('footer')) {
        loadComponent('footer.html', 'footer');
    }
}); 