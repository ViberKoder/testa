// Initialize Telegram Web App (if available)
let tg = null;
if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#ffffff');
    tg.setBackgroundColor('#ffffff');
}

// Get user ID from Telegram or URL
function getUserID() {
    // Try Telegram WebApp first
    if (tg && tg.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user.id;
    }
    
    // Fallback to URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    if (userId) {
        return parseInt(userId);
    }
    
    return null;
}

// API endpoint - get from environment or use default
// For Vercel, set API_URL as environment variable
// Default to Railway URL
const API_URL = window.API_URL || 'https://web-production-9eac6.up.railway.app/api/stats';
// Extract base URL for other API endpoints
const BOT_API_URL = API_URL.endsWith('/api/stats') ? API_URL.replace('/api/stats', '') : API_URL.replace('/stats', '');

// Calculate points based on stats
// my_eggs_hatched * 2 (when user's eggs are hatched by others)
// hatched_by_me * 1 (when user hatches others' eggs)
function calculatePoints(data) {
    const myEggsHatched = data.my_eggs_hatched || 0;
    const hatchedByMe = data.hatched_by_me || 0;
    
    return (myEggsHatched * 2) + (hatchedByMe * 1);
}

// Animate counter value
function animateCounter(element, startValue, endValue, duration = 1000) {
    const startTime = performance.now();
    const start = parseInt(startValue) || 0;
    const end = parseInt(endValue) || 0;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = end.toLocaleString();
            // Add update animation class
            element.classList.add('updated');
            setTimeout(() => {
                element.classList.remove('updated');
            }, 300);
        }
    }
    
    requestAnimationFrame(update);
}

// Store current points value
let currentPointsValue = 0;

// Load statistics and update points
async function loadStats() {
    const counterEl = document.getElementById('points-counter');
    if (!counterEl) {
        console.error('Counter element not found');
        return;
    }
    
    const userId = getUserID();
    
    if (!userId) {
        console.warn('No user ID found');
        counterEl.textContent = '0';
        currentPointsValue = 0;
        return;
    }
    
    // Show loading
    counterEl.textContent = '...';
    
    try {
        console.log(`Fetching stats from: ${API_URL}?user_id=${userId}`);
        const response = await fetch(`${API_URL}?user_id=${userId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Stats data:', data);
            
            const newPoints = calculatePoints(data);
            console.log(`Calculated points: ${newPoints} (my_eggs_hatched: ${data.my_eggs_hatched || 0}, hatched_by_me: ${data.hatched_by_me || 0})`);
            
            // Update counter with animation
            animateCounter(counterEl, 0, newPoints, 1000);
            currentPointsValue = newPoints;
        } else {
            const errorText = await response.text();
            console.error('API error:', response.status, errorText);
            counterEl.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        counterEl.textContent = '0';
    }
}

// Load and display .tgs animation
async function loadTGSAnimation(filePath, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Animation container ${containerId} not found`);
        return;
    }
    
    try {
        // Load .tgs file
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load .tgs file: ${response.status}`);
        }
        
        // Get file as ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        
        // Decompress gzip using pako
        const decompressed = pako.inflate(new Uint8Array(arrayBuffer), { to: 'string' });
        
        // Parse JSON
        const animationData = JSON.parse(decompressed);
        
        // Load animation with lottie
        if (typeof lottie !== 'undefined') {
            lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: animationData
            });
            console.log(`TGS animation ${containerId} loaded successfully`);
        } else {
            console.error('Lottie library not loaded');
        }
    } catch (error) {
        console.error(`Error loading TGS animation ${containerId}:`, error);
    }
}

// Load all TGS animations
async function loadAllAnimations() {
    await loadTGSAnimation('/egg.tgs', 'egg-animation');
    await loadTGSAnimation('/more.tgs', 'more-icon');
    await loadTGSAnimation('/chick.tgs', 'profile-icon');
    await loadTGSAnimation('/egg.tgs', 'nav-home-icon');
    await loadTGSAnimation('/more.tgs', 'nav-more-icon');
    await loadTGSAnimation('/chick.tgs', 'nav-profile-icon');
    await loadTGSAnimation('/explorer-icon.tgs', 'nav-explorer-icon');
}

// Navigation
let currentPage = 'home-page';

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
        currentPage = pageId;
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
    
    // Update Telegram back button
    if (tg) {
        if (pageId === 'home-page') {
            tg.BackButton.hide();
        } else {
            tg.BackButton.show();
        }
    }
    
    // Load page-specific data
    if (pageId === 'more-page') {
        loadTasks();
    } else if (pageId === 'profile-page') {
        loadProfile();
        // Initialize TON Connect when profile page is shown (if not already initialized)
        if (!tonConnectUI) {
            setTimeout(() => {
                initTONConnect();
            }, 300);
        }
    } else if (pageId === 'explorer-page') {
        loadExplorerMyEggs();
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.page;
            showPage(pageId);
        });
    });
    
    // Handle Telegram back button
    if (tg) {
        tg.BackButton.onClick(() => {
            if (currentPage !== 'home-page') {
                showPage('home-page');
            } else {
                tg.close();
            }
        });
    }
}

// TON Connect
let tonConnectUI = null;
let walletAddress = null;

function initTONConnect() {
    // Check if TON Connect UI is loaded (according to docs: TON_CONNECT_UI.TonConnectUI)
    if (typeof window.TON_CONNECT_UI === 'undefined' || !window.TON_CONNECT_UI.TonConnectUI) {
        console.error('TON Connect UI library not loaded');
        // Wait a bit and try again
        setTimeout(() => {
            if (typeof window.TON_CONNECT_UI !== 'undefined' && window.TON_CONNECT_UI.TonConnectUI) {
                initTONConnect();
            }
        }, 500);
        return;
    }
    
    const container = document.getElementById('ton-connect-container');
    if (!container) {
        console.error('TON Connect container not found');
        return;
    }
    
    // Don't clear container - TonConnectUI will manage it
    try {
        tonConnectUI = new window.TON_CONNECT_UI.TonConnectUI({
            manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
            buttonRootId: 'ton-connect-container'
        });
        
        console.log('TON Connect UI initialized');
        
        // Check if wallet is already connected
        tonConnectUI.connectionRestored.then(() => {
            const account = tonConnectUI.wallet?.account;
            if (account) {
                walletAddress = account.address;
                console.log('TON wallet connected:', walletAddress);
            }
        }).catch(err => {
            console.log('No previous connection:', err);
        });
        
        // Handle wallet connection
        tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                walletAddress = wallet.account.address;
                console.log('TON wallet connected:', walletAddress);
            } else {
                walletAddress = null;
                console.log('TON wallet disconnected');
            }
        });
    } catch (error) {
        console.error('Error initializing TON Connect:', error);
    }
}

// Tasks
async function loadTasks() {
    console.log('Loading tasks...');
    await updateTaskStatus();
}

async function updateTaskStatus() {
    const userId = getUserID();
    if (!userId) return;
    
    try {
        // Get user stats which includes task status
        const response = await fetch(`${API_URL}?user_id=${userId}`);
        if (response.ok) {
            const data = await response.json();
            
            // Check subscription task
            const subscribeBtn = document.getElementById('subscribe-btn');
            const subscribeTask = document.getElementById('subscribe-task');
            
            // Check if task is completed (from completed_tasks or from subscription check)
            const checkSubResponse = await fetch(`${BOT_API_URL}/api/stats/check_subscription?user_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            });
            
            if (checkSubResponse.ok) {
                const subData = await checkSubResponse.json();
                console.log('Task status check:', subData);
                
                if (subData.subscribed && subscribeBtn && subscribeTask) {
                    // Task is completed
                    subscribeTask.style.opacity = '0.7';
                    subscribeTask.classList.add('completed');
                    subscribeBtn.textContent = 'Completed';
                    subscribeBtn.classList.add('completed');
                    subscribeBtn.disabled = true;
                    console.log('Task marked as completed in updateTaskStatus');
                } else if (subscribeBtn && subscribeTask) {
                    // Task is not completed
                    subscribeTask.style.opacity = '1';
                    subscribeTask.classList.remove('completed');
                    subscribeBtn.textContent = 'Complete';
                    subscribeBtn.classList.remove('completed');
                    subscribeBtn.disabled = false;
                }
            } else {
                console.error('Failed to check subscription status:', checkSubResponse.status);
            }
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function setupSubscribeButton() {
    const subscribeBtn = document.getElementById('subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', async () => {
            if (subscribeBtn.classList.contains('completed') || subscribeBtn.disabled) {
                return;
            }
            
            const userId = getUserID();
            if (!userId) {
                if (tg) {
                    tg.showAlert('Error: User ID not found');
                } else {
                    alert('Error: User ID not found');
                }
                return;
            }
            
            console.log('Subscribe button clicked');
            
            // Open channel
            if (tg) {
                tg.openTelegramLink('https://t.me/hatch_egg');
            } else {
                window.open('https://t.me/hatch_egg', '_blank');
            }
            
            // Wait a bit for user to subscribe, then check
            setTimeout(async () => {
                try {
                    console.log('Checking subscription for user:', userId);
                    console.log('BOT_API_URL:', BOT_API_URL);
                    
                    const url = `${BOT_API_URL}/api/stats/check_subscription?user_id=${userId}`;
                    console.log('Fetching URL:', url);
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    console.log('Subscription check response status:', response.status);
                    console.log('Response headers:', response.headers);
                    
                    // Try to parse response as JSON
                    let data;
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        const text = await response.text();
                        console.error('Non-JSON response:', text);
                        try {
                            data = JSON.parse(text);
                        } catch (e) {
                            throw new Error(`Invalid response: ${text.substring(0, 100)}`);
                        }
                    }
                    
                    console.log('Subscription check data:', data);
                    
                    if (response.ok || response.status === 200) {
                        if (data.subscribed) {
                            // Task completed - update UI immediately
                            const taskCard = document.getElementById('subscribe-task');
                            const subscribeBtnEl = document.getElementById('subscribe-btn');
                            
                            if (taskCard && subscribeBtnEl) {
                                // Update task card
                                taskCard.style.opacity = '0.7';
                                taskCard.classList.add('completed');
                                
                                // Update button
                                subscribeBtnEl.textContent = 'Completed';
                                subscribeBtnEl.classList.add('completed');
                                subscribeBtnEl.disabled = true;
                                
                                console.log('Task UI updated to completed state');
                            }
                            
                            // Show success message
                            if (tg) {
                                tg.showAlert('Task completed! You earned 20 Eggs! 🎉');
                            } else {
                                alert('Task completed! You earned 20 Eggs! 🎉');
                            }
                            
                            // Reload stats and tasks to update everything
                            try {
                                await loadStats();
                                await updateTaskStatus();
                                await loadProfile(); // Update eggs balance
                            } catch (reloadError) {
                                console.error('Error reloading data:', reloadError);
                            }
                        } else {
                            // Not subscribed yet
                            console.log('User not subscribed yet');
                            if (tg) {
                                tg.showAlert('Please subscribe to @hatch_egg channel first');
                            } else {
                                alert('Please subscribe to @hatch_egg channel first');
                            }
                        }
                    } else {
                        // Response not OK but we got data
                        if (data && data.subscribed !== undefined) {
                            // Still process the data even if status is not 200
                            if (data.subscribed) {
                                const taskCard = document.getElementById('subscribe-task');
                                const subscribeBtnEl = document.getElementById('subscribe-btn');
                                
                                if (taskCard && subscribeBtnEl) {
                                    taskCard.style.opacity = '0.7';
                                    taskCard.classList.add('completed');
                                    subscribeBtnEl.textContent = 'Completed';
                                    subscribeBtnEl.classList.add('completed');
                                    subscribeBtnEl.disabled = true;
                                }
                                
                                if (tg) {
                                    tg.showAlert('Task completed! You earned 20 Eggs! 🎉');
                                } else {
                                    alert('Task completed! You earned 20 Eggs! 🎉');
                                }
                                
                                await loadStats();
                                await updateTaskStatus();
                                await loadProfile();
                            }
                        } else {
                            const errorText = data?.error || JSON.stringify(data);
                            console.error('Subscription check failed:', response.status, errorText);
                            if (tg) {
                                tg.showAlert(`Error: ${response.status}. ${errorText}`);
                            } else {
                                alert(`Error: ${response.status}. ${errorText}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error checking subscription:', error);
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    });
                    if (tg) {
                        tg.showAlert(`Error: ${error.message || 'Please try again.'}`);
                    } else {
                        alert(`Error: ${error.message || 'Please try again.'}`);
                    }
                }
            }, 2000);
        });
    }
}


// Buy Eggs - removed for beta (unlimited eggs)

// Share Button
// Используем Telegram Share Button согласно документации: https://core.telegram.org/widgets/share
// Формат: https://t.me/share/url?url={url}&text={text}
function setupShareButton() {
    const shareBtn = document.getElementById('share-egg-btn');
    if (!shareBtn) return;
    
    shareBtn.addEventListener('click', () => {
        const tg = window.Telegram?.WebApp;
        const message = '@tohatchbot egg';
        const botUsername = 'tohatchbot';
        
        // Используем Telegram Share Button формат
        // URL обязателен для Telegram Share, используем URL бота
        // Текст будет основным содержимым, которое пользователь увидит и сможет отредактировать
        const botUrl = `https://t.me/${botUsername}`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(message)}`;
        
        if (tg) {
            // В Telegram WebApp используем openTelegramLink для открытия share диалога
            if (tg.openTelegramLink) {
                tg.openTelegramLink(shareUrl);
            } else if (tg.openLink) {
                // Fallback на openLink
                tg.openLink(shareUrl, {
                    try_instant_view: false
                });
            } else {
                // Последний fallback - открываем в новом окне
                window.open(shareUrl, '_blank');
            }
        } else {
            // Fallback для обычного браузера - открываем share URL
            window.open(shareUrl, '_blank');
        }
    });
}

// Profile
async function loadProfile() {
    const userId = getUserID();
    if (!userId) return;
    
    // Get user info from Telegram
    if (tg && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        const nameEl = document.getElementById('profile-name');
        const idEl = document.getElementById('profile-id');
        
        if (nameEl) {
            nameEl.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        }
        if (idEl) {
            idEl.textContent = `ID: ${user.id}`;
        }
    }
    
    // Load stats for referrals and eggs balance
    try {
        const response = await fetch(`${API_URL}?user_id=${userId}`);
        if (response.ok) {
            const data = await response.json();
            
            const referralsCountEl = document.getElementById('referrals-count');
            const referralEarningsEl = document.getElementById('referral-earnings');
            const eggsBalanceEl = document.getElementById('eggs-balance');
            
            if (referralsCountEl) {
                referralsCountEl.textContent = (data.referrals_count || 0).toLocaleString();
            }
            if (referralEarningsEl) {
                referralEarningsEl.textContent = (data.referral_earned || 0).toLocaleString();
            }
            if (eggsBalanceEl) {
                // Use available_eggs from API (already calculated: FREE_EGGS_PER_DAY + paid_eggs - daily_sent)
                const availableEggs = data.available_eggs !== undefined ? data.available_eggs : 
                    Math.max(0, (data.free_eggs || 10) + (data.paid_eggs || 0) - (data.daily_eggs_sent || 0));
                eggsBalanceEl.textContent = availableEggs.toLocaleString();
                console.log('Eggs balance:', { 
                    available_eggs: data.available_eggs,
                    free_eggs: data.free_eggs,
                    paid_eggs: data.paid_eggs,
                    daily_eggs_sent: data.daily_eggs_sent,
                    calculated: availableEggs
                });
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Initialize on page load
function init() {
    console.log('Initializing app...');
    console.log('API_URL:', API_URL);
    console.log('BOT_API_URL:', BOT_API_URL);
    
    // Load all TGS animations
    loadAllAnimations();
    
    // Setup navigation
    setupNavigation();
    
    // Setup tasks
    setupSubscribeButton();
    
    // Setup share button
    setupShareButton();
    
    // Initialize TON Connect (will work when Profile page is opened)
    // Wait for libraries to load
    setTimeout(() => {
        if (document.getElementById('ton-connect-container')) {
            initTONConnect();
        }
    }, 1000);
    
    // Load stats
    loadStats();
    
    // Refresh stats every 30 seconds
    setInterval(loadStats, 30000);
    
    // Initialize Explorer
    initExplorer();
}

// Explorer functionality
const EGGCHAIN_API_URL = window.EGGCHAIN_API_URL || (() => {
    let apiUrl = window.API_URL || 'https://web-production-9eac6.up.railway.app/api/stats';
    if (apiUrl.endsWith('/api/stats')) {
        apiUrl = apiUrl.replace('/api/stats', '/api');
    } else if (apiUrl.endsWith('/stats')) {
        apiUrl = apiUrl.replace('/stats', '/api');
    } else if (!apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.endsWith('/') ? apiUrl + 'api' : apiUrl + '/api';
    }
    return apiUrl;
})();

function initExplorer() {
    const searchBtn = document.getElementById('explorer-search-btn');
    const eggIdInput = document.getElementById('explorer-egg-id-input');
    
    if (searchBtn && eggIdInput) {
        searchBtn.addEventListener('click', () => {
            searchEgg(eggIdInput.value);
        });
        
        eggIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchEgg(eggIdInput.value);
            }
        });
    }
}

async function searchEgg(eggId) {
    if (!eggId || !eggId.trim()) {
        showExplorerError('Please enter an egg ID or username');
        return;
    }

    const searchQuery = eggId.trim();
    const resultDiv = document.getElementById('explorer-search-result');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="loading">Searching...</div>';

    try {
        let response;
        let data;
        
        // Проверяем, является ли запрос username (начинается с @)
        if (searchQuery.startsWith('@')) {
            const username = searchQuery.substring(1);
            response = await fetch(`${EGGCHAIN_API_URL}/user/username/${encodeURIComponent(username)}`);
            data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'User not found');
            }

            displayUserProfile(data);
        } else {
            // Ищем яйцо по ID
            // Скрываем контейнер истории яиц пользователя при поиске яйца
            const userEggsHistoryContainer = document.getElementById('user-eggs-history-container');
            if (userEggsHistoryContainer) {
                userEggsHistoryContainer.style.display = 'none';
            }
            currentViewingUserId = null;
            
            response = await fetch(`${EGGCHAIN_API_URL}/egg/${encodeURIComponent(searchQuery)}`);
            data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Egg not found');
            }

            displayEggResult(data);
        }
    } catch (error) {
        console.error('Search error:', error);
        resultDiv.innerHTML = `<div class="error">❌ ${error.message || 'Failed to fetch'}</div>`;
    }
}

function displayEggResult(egg) {
    const resultDiv = document.getElementById('explorer-search-result');
    if (!resultDiv) return;
    
    const hatchedStatus = egg.hatched_by ? 'hatched' : 'pending';
    const hatchedText = egg.hatched_by ? 'Hatched' : 'Pending';
    
    const timestampSent = egg.timestamp_sent ? new Date(egg.timestamp_sent).toLocaleString('en-US') : 'Unknown';
    const timestampHatched = egg.timestamp_hatched ? new Date(egg.timestamp_hatched).toLocaleString('en-US') : '—';
    
    const timeAgoSent = egg.timestamp_sent ? getTimeAgo(new Date(egg.timestamp_sent)) : '';
    const timeAgoHatched = egg.timestamp_hatched ? getTimeAgo(new Date(egg.timestamp_hatched)) : '';

    resultDiv.innerHTML = `
        <div class="egg-detail-card">
            <div class="egg-detail-header">
                <div class="egg-avatar-container">
                    <div id="egg-avatar-animation" class="egg-avatar-animation"></div>
                </div>
                <div class="egg-detail-title">
                    <h3>Egg #${egg.egg_id.substring(0, 8)}...</h3>
                    <span class="egg-status-badge ${hatchedStatus}">${hatchedText}</span>
                </div>
            </div>
            
            <div class="egg-detail-info">
                <div class="info-section">
                    <div class="info-label">Egg ID</div>
                    <div class="info-value mono">${egg.egg_id}</div>
                </div>
                
                <div class="info-section">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                        <span class="status-badge ${hatchedStatus}">${hatchedText}</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-label">Sent By</div>
                    <div class="info-value-with-avatar">
                        ${egg.sender_avatar ? `<img src="${egg.sender_avatar}" class="user-avatar" onerror="this.style.display='none'">` : '<div class="user-avatar-placeholder"></div>'}
                        ${egg.sender_username ? `
                        <span class="username-link" onclick="event.stopPropagation(); searchUserByUsername('${egg.sender_username}');">
                            @${egg.sender_username}
                        </span>
                        ` : `
                        <span class="username-link" onclick="event.stopPropagation(); viewUserEggs(${egg.sender_id}, '');">
                            User ID: ${egg.sender_id}
                        </span>
                        `}
                    </div>
                    <div class="info-subvalue">${timestampSent}${timeAgoSent ? ` (${timeAgoSent})` : ''}</div>
                </div>
                
                ${egg.hatched_by ? `
                <div class="info-section">
                    <div class="info-label">Hatched By</div>
                    <div class="info-value-with-avatar">
                        ${egg.hatched_by_avatar ? `<img src="${egg.hatched_by_avatar}" class="user-avatar" onerror="this.style.display='none'">` : '<div class="user-avatar-placeholder"></div>'}
                        ${egg.hatched_by_username ? `
                        <span class="username-link" onclick="event.stopPropagation(); searchUserByUsername('${egg.hatched_by_username}');">
                            @${egg.hatched_by_username}
                        </span>
                        ` : `
                        <span class="username-link" onclick="event.stopPropagation(); viewUserEggs(${egg.hatched_by}, '');">
                            User ID: ${egg.hatched_by}
                        </span>
                        `}
                    </div>
                    <div class="info-subvalue">${timestampHatched}${timeAgoHatched ? ` (${timeAgoHatched})` : ''}</div>
                </div>
                ` : ''}
                
                <div class="info-section">
                    <div class="info-label">Transaction Hash</div>
                    <div class="info-value mono small">${egg.egg_id}</div>
                </div>
            </div>
        </div>
    `;
    
    // Load egg avatar animation
    loadTGSAnimation('/egg-avatar.tgs', 'egg-avatar-animation');
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
}

let currentViewingUserId = null; // ID пользователя, профиль которого сейчас просматривается

async function loadExplorerMyEggs() {
    const userId = getUserID();
    const eggsListDiv = document.getElementById('explorer-my-eggs-list');

    if (!eggsListDiv) return;

    // Если просматриваем чужого пользователя, не показываем "My Eggs"
    if (currentViewingUserId && currentViewingUserId !== userId) {
        eggsListDiv.innerHTML = '';
        return;
    }

    if (!userId) {
        eggsListDiv.innerHTML = '<div class="error">Unable to determine user. Please open through Telegram bot.</div>';
        return;
    }

    eggsListDiv.innerHTML = '<div class="loading">Loading your eggs...</div>';

    try {
        const response = await fetch(`${EGGCHAIN_API_URL}/user/${userId}/eggs`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error loading eggs');
        }

        displayMyEggs(data.eggs || []);
    } catch (error) {
        eggsListDiv.innerHTML = `<div class="error">❌ ${error.message}</div>`;
    }
}

function searchUserByUsername(username) {
    const input = document.getElementById('explorer-egg-id-input');
    if (input) {
        input.value = `@${username}`;
        searchEgg(`@${username}`);
    }
}

function displayMyEggs(eggs) {
    const eggsListDiv = document.getElementById('explorer-my-eggs-list');
    if (!eggsListDiv) return;

    if (eggs.length === 0) {
        eggsListDiv.innerHTML = '<div class="empty">You haven\'t sent any eggs yet</div>';
        return;
    }

    eggsListDiv.innerHTML = eggs.map(egg => {
        const hatchedStatus = egg.hatched_by ? 'hatched' : 'pending';
        const hatchedText = egg.hatched_by ? 'Hatched' : 'Pending';
        const timestampSent = egg.timestamp_sent ? new Date(egg.timestamp_sent).toLocaleString('en-US') : 'Unknown';
        const timeAgo = egg.timestamp_sent ? getTimeAgo(new Date(egg.timestamp_sent)) : '';

        return `
            <div class="egg-list-item" onclick="searchEggById('${egg.egg_id}')">
                <div class="egg-list-item-header">
                    <span class="egg-list-id mono">#${egg.egg_id.substring(0, 12)}...</span>
                    <span class="status-badge ${hatchedStatus}">${hatchedText}</span>
                </div>
                <div class="egg-list-meta">
                    <div>Sent: ${timestampSent}${timeAgo ? ` (${timeAgo})` : ''}</div>
                    ${egg.hatched_by ? `<div>Hatched by: ${egg.hatched_by_username ? `<span class="username-link-inline" onclick="event.stopPropagation(); searchUserByUsername('${egg.hatched_by_username}');">@${egg.hatched_by_username}</span>` : `ID: ${egg.hatched_by}`}</div>` : '<div>Awaiting hatch</div>'}
                </div>
            </div>
        `;
    }).join('');
}

function searchEggById(eggId) {
    const input = document.getElementById('explorer-egg-id-input');
    if (input) {
        input.value = eggId;
        searchEgg(eggId);
    }
}

function showExplorerError(message) {
    const resultDiv = document.getElementById('explorer-search-result');
    if (resultDiv) {
        resultDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
    }
}

function displayUserProfile(userData) {
    const resultDiv = document.getElementById('explorer-search-result');
    const userEggsHistoryContainer = document.getElementById('user-eggs-history-container');
    
    if (!resultDiv) return;
    
    const { user_id, username, avatar, eggs_sent, eggs_hatched, total_sent, total_hatched } = userData;
    
    // Устанавливаем текущего просматриваемого пользователя
    currentViewingUserId = user_id;
    
    // Показываем контейнер для истории яиц пользователя
    if (userEggsHistoryContainer) {
        userEggsHistoryContainer.style.display = 'block';
    }
    
    // Скрываем "My Eggs" если это не текущий пользователь
    const myEggsSection = document.getElementById('my-eggs-section');
    const currentUserId = getUserID();
    if (myEggsSection && currentUserId && currentUserId !== user_id) {
        myEggsSection.style.display = 'none';
    } else if (myEggsSection) {
        myEggsSection.style.display = 'block';
    }
    
    // Генерируем уникальный ID для анимации
    const avatarId = `user-avatar-${user_id}-${Date.now()}`;
    
    resultDiv.innerHTML = `
        <div class="user-profile-card" onclick="viewUserEggsHistory(${user_id}, '${username || ''}')">
            <div class="user-profile-header">
                <div class="user-profile-avatar-container">
                    <div id="${avatarId}" class="user-profile-avatar-animation"></div>
                </div>
                <div class="user-profile-info">
                    <h3>${username ? `@${username}` : `User ${user_id}`}</h3>
                    <div class="user-profile-id">ID: ${user_id}</div>
                    <div class="user-profile-stats">
                        <div class="stat-item">
                            <span class="stat-value">${total_sent}</span>
                            <span class="stat-label">Sent</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${total_hatched}</span>
                            <span class="stat-label">Hatched</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Загружаем TGS анимацию
    loadTGSAnimation('/user-avatar.tgs', avatarId);
    
    // Показываем историю яиц сразу
    displayUserEggsHistory(userData);
}

function displayUserEggsHistory(userData) {
    // Используем отдельный контейнер для истории яиц пользователя
    const eggsListDiv = document.getElementById('user-eggs-history-container');
    if (!eggsListDiv) return;
    
    const { eggs_sent, eggs_hatched } = userData;
    
    if (eggs_sent.length === 0 && eggs_hatched.length === 0) {
        eggsListDiv.innerHTML = '<div class="empty">No eggs found</div>';
        return;
    }
    
    // Генерируем уникальные ID для табов
    const tabsId = `eggs-tabs-${Date.now()}`;
    const sentContentId = `sent-content-${Date.now()}`;
    const hatchedContentId = `hatched-content-${Date.now()}`;
    
    eggsListDiv.innerHTML = `
        <div class="eggs-tabs-container" id="${tabsId}">
            <div class="eggs-tabs">
                <button class="egg-tab active" data-tab="sent" onclick="switchEggTab('${tabsId}', 'sent')">
                    Sent Eggs
                </button>
                <button class="egg-tab" data-tab="hatched" onclick="switchEggTab('${tabsId}', 'hatched')">
                    Hatched Eggs
                </button>
            </div>
            <div class="eggs-tab-content active" id="${sentContentId}" data-content="sent">
                <div class="eggs-list-container">
                    ${eggs_sent.length > 0 ? eggs_sent.map(egg => {
                        const hatchedStatus = egg.hatched_by ? 'hatched' : 'pending';
                        const hatchedText = egg.hatched_by ? 'Hatched' : 'Pending';
                        const timestampSent = egg.timestamp_sent ? new Date(egg.timestamp_sent).toLocaleString('en-US') : 'Unknown';
                        const timeAgo = egg.timestamp_sent ? getTimeAgo(new Date(egg.timestamp_sent)) : '';
                        
                        return `
                            <div class="egg-list-item" onclick="searchEggById('${egg.egg_id}')">
                                <div class="egg-list-item-header">
                                    <span class="egg-list-id mono">#${egg.egg_id.substring(0, 12)}...</span>
                                    <span class="status-badge ${hatchedStatus}">${hatchedText}</span>
                                </div>
                                <div class="egg-list-meta">
                                    <div>Sent: ${timestampSent}${timeAgo ? ` (${timeAgo})` : ''}</div>
                                    ${egg.hatched_by ? `<div>Hatched by: ${egg.hatched_by_username ? `<span class="username-link-inline" onclick="event.stopPropagation(); searchUserByUsername('${egg.hatched_by_username}');">@${egg.hatched_by_username}</span>` : `ID: ${egg.hatched_by}`}</div>` : '<div>Awaiting hatch</div>'}
                                </div>
                            </div>
                        `;
                    }).join('') : '<div class="empty">No eggs sent</div>'}
                </div>
            </div>
            <div class="eggs-tab-content" id="${hatchedContentId}" data-content="hatched">
                <div class="eggs-list-container">
                    ${eggs_hatched.length > 0 ? eggs_hatched.map(egg => {
                        const timestampHatched = egg.timestamp_hatched ? new Date(egg.timestamp_hatched).toLocaleString('en-US') : 'Unknown';
                        const timeAgo = egg.timestamp_hatched ? getTimeAgo(new Date(egg.timestamp_hatched)) : '';
                        
                        return `
                            <div class="egg-list-item" onclick="searchEggById('${egg.egg_id}')">
                                <div class="egg-list-item-header">
                                    <span class="egg-list-id mono">#${egg.egg_id.substring(0, 12)}...</span>
                                    <span class="status-badge hatched">Hatched</span>
                                </div>
                                <div class="egg-list-meta">
                                    <div>Hatched: ${timestampHatched}${timeAgo ? ` (${timeAgo})` : ''}</div>
                                    <div>Sent by: ${egg.sender_username ? `<span class="username-link-inline" onclick="event.stopPropagation(); searchUserByUsername('${egg.sender_username}');">@${egg.sender_username}</span>` : `ID: ${egg.sender_id}`}</div>
                                </div>
                            </div>
                        `;
                    }).join('') : '<div class="empty">No eggs hatched</div>'}
                </div>
            </div>
        </div>
    `;
}

function switchEggTab(containerId, tabName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Обновляем табы
    const tabs = container.querySelectorAll('.egg-tab');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Обновляем контент
    const contents = container.querySelectorAll('.eggs-tab-content');
    contents.forEach(content => {
        if (content.dataset.content === tabName) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function viewUserEggsHistory(userId, username) {
    // Функция для просмотра истории яиц пользователя
    // Данные уже загружены в displayUserProfile, просто прокручиваем к списку
    const eggsListDiv = document.getElementById('explorer-my-eggs-list');
    if (eggsListDiv) {
        eggsListDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already ready
    init();
}
