const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

function addTask() {
    if (inputBox.value === '') {
        alert("You must write something!");
    } 
    else {
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        listContainer.appendChild(li);
        let span = document.createElement("span");
        span.innerHTML = "\u00d7";
        li.appendChild(span);
    }
    inputBox.value = "";
    saveData();
    // Update contextual Clear Completed button
    updateClearCompletedButton();
}

listContainer.addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        const li = e.target;

        // Use FLIP animation helper so movement animates smoothly
        animateListReorder(listContainer, () => {
            li.classList.toggle("checked");

            if (li.classList.contains("checked")) {
                // Move checked items to the end (below unchecked items)
                listContainer.appendChild(li);
            } else {
                // Move unchecked items back before the first checked item
                const firstChecked = listContainer.querySelector("li.checked");
                if (firstChecked) {
                    listContainer.insertBefore(li, firstChecked);
                } else {
                    listContainer.appendChild(li);
                }
            }
        });

        saveData();
        updateClearCompletedButton();
    }
    else if (e.target.tagName === "SPAN") {
        const li = e.target.parentElement;

        // Animate other items moving up when this item is removed
        animateListReorder(listContainer, () => {
            li.remove();
        });

        saveData();
        updateClearCompletedButton();
    }
}, false);

function saveData() {
    localStorage.setItem("data", listContainer.innerHTML);
}

function showTask() {
    listContainer.innerHTML = localStorage.getItem("data");
}
showTask();
// Ensure the Clear Completed container/button are set up after loading
// (the container sits outside the UL so it's not a list item)
const clearContainerEl = document.getElementById('clear-completed-container');
const clearBtnEl = document.getElementById('clear-completed-btn');
if (clearBtnEl) clearBtnEl.addEventListener('click', clearCompletedTasks);
updateClearCompletedButton();
// Focus the input box on page load so the user can start typing immediately
if (inputBox) {
    inputBox.focus();

    // Allow pressing Enter to add a task (convenience for quick entry)
    inputBox.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            addTask();
        }
    });
}

/**
 * Animate list reorder using the FLIP technique.
 * container: parent element whose children (list items) will be reordered.
 * domChange: a callback that performs the DOM reordering (mutations).
 */
function animateListReorder(container, domChange) {
    const children = Array.from(container.children);
    // Record the first bounding rect for each element
    const firstRects = new Map();
    children.forEach(el => {
        firstRects.set(el, el.getBoundingClientRect());
    });

    // Perform the DOM change (move / remove / insert)
    domChange();

    // After DOM change, for each element that still exists compute the delta
    const newChildren = Array.from(container.children);
    newChildren.forEach(el => {
        const firstRect = firstRects.get(el);
        if (!firstRect) return; // new element was added, no animation needed
        const lastRect = el.getBoundingClientRect();
        const deltaY = firstRect.top - lastRect.top;
        const deltaX = firstRect.left - lastRect.left;

        if (deltaY || deltaX) {
            // Apply inverse transform to visually keep element in old position
            el.style.transition = 'none';
            el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            // Force repaint
            el.getBoundingClientRect();

            // Then animate to natural position
            requestAnimationFrame(() => {
                el.style.transition = 'transform 320ms cubic-bezier(.2,.8,.2,1)';
                el.style.transform = '';
            });

            // Clean up inline styles after transition finishes
            const cleanup = (ev) => {
                if (ev && ev.propertyName && ev.propertyName !== 'transform') return;
                el.style.transition = '';
                el.style.transform = '';
                el.removeEventListener('transitionend', cleanup);
            };
            el.addEventListener('transitionend', cleanup);
        }
    });
}

// Clear all tasks with a confirmation and a short fade animation
function clearAllTasks() {
    if (!listContainer) return;
    const confirmed = confirm('Clear all tasks? This cannot be undone.');
    if (!confirmed) return;

    // Fade-out animation for each item
    const items = Array.from(listContainer.children);
    items.forEach((el, idx) => {
        // stagger slightly for nicer effect
        const delay = idx * 35; // ms
        setTimeout(() => {
            el.style.transition = 'transform 220ms ease, opacity 180ms ease';
            el.style.opacity = '0';
            el.style.transform = 'translateX(20px)';
        }, delay);
    });

    // After animation finishes, clear the list and localStorage
    const totalDelay = items.length * 35 + 250;
    setTimeout(() => {
        listContainer.innerHTML = '';
        localStorage.removeItem('data');
        // Keep focus on input so user can start typing again
        if (inputBox) inputBox.focus();
    }, totalDelay);
}

// Create or move a contextual "Clear completed" button that appears under checked items
function updateClearCompletedButton() {
    const checkedItems = listContainer.querySelectorAll('li.checked');
    if (!clearContainerEl) return;

    if (checkedItems.length === 0) {
        clearContainerEl.classList.add('hidden');
        return;
    }

    // show button and put a count
    const count = checkedItems.length;
    if (clearBtnEl) clearBtnEl.textContent = `Clear completed (${count})`;
    clearContainerEl.classList.remove('hidden');
    // scroll the button into view smoothly so it's visible under the list
    clearContainerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Remove checked items with a small fade/stagger and persist change
function clearCompletedTasks() {
    const checkedItems = Array.from(listContainer.querySelectorAll('li.checked'));
    if (checkedItems.length === 0) return;

    // Staggered fade-out for each checked item
    checkedItems.forEach((el, idx) => {
        const delay = idx * 45;
        setTimeout(() => {
            el.style.transition = 'transform 220ms ease, opacity 180ms ease';
            el.style.opacity = '0';
            el.style.transform = 'translateX(20px)';
        }, delay);
    });

    const totalDelay = checkedItems.length * 45 + 220;
    setTimeout(() => {
        // Remove the elements from DOM
        checkedItems.forEach(el => el.remove());
        // Hide the standalone clear button container
        if (clearContainerEl) clearContainerEl.classList.add('hidden');
        saveData();
        if (inputBox) inputBox.focus();
    }, totalDelay);
}