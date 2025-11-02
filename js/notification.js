// Notification functionality
const notification = document.getElementById("notification");
const notificationText = document.getElementById("notificationText");

// Show notification function
function showNotification(message, type = 'success') {
  notificationText.textContent = message;
  notification.className = 'notification';
  
  if (type === 'error') {
    notification.classList.add('error');
    notification.innerHTML = '<i class="fa-solid fa-exclamation-circle"></i> ' + message;
  } else if (type === 'warning') {
    notification.classList.add('warning');
    notification.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> ' + message;
  } else {
    notification.innerHTML = '<i class="fa-solid fa-check-circle"></i> ' + message;
  }
  
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}