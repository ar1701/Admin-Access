// public/script.js
document.getElementById('searchInput').addEventListener('input', async function(e) {
    const searchTerm = e.target.value;
    
    try {
        const response = await fetch(`/search-faculty?name=${searchTerm}`);
        const faculties = await response.json();
        updateTable(faculties);
    } catch (err) {
        console.error('Error searching faculty:', err);
    }
});

function updateTable(faculties) {
    const tableBody = document.getElementById('facultyTableBody');
    tableBody.innerHTML = '';
    
    faculties.forEach(faculty => {
        const row = document.createElement('tr');
        row.dataset.id = faculty._id;
        
        row.innerHTML = `
            <td>${faculty.name}</td>
            <td>${faculty.department}</td>
            <td>${faculty.designation}</td>
            <td>${faculty.accessCode}</td>
            <td>${faculty.phone}</td>
            <td class="actions">
                <button class="edit-btn" onclick="editFaculty(this)">Edit</button>
                <button class="delete-btn" onclick="deleteFaculty('${faculty._id}', this)">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function editFaculty(button) {
    const row = button.closest('tr');
    const cells = row.cells;
    
    for (let i = 0; i < cells.length - 1; i++) {
        const cell = cells[i];
        const currentValue = cell.textContent;
        
        if (i === 1) { // Department
            cell.innerHTML = `
                <select>
                    ${['CSE', 'IT', 'SFE', 'CE', 'ME', 'EEE', 'EC']
                        .map(dept => `<option value="${dept}" ${currentValue === dept ? 'selected' : ''}>${dept}</option>`)
                        .join('')}
                </select>
            `;
        } else if (i === 2) { // Designation
            cell.innerHTML = `
                <select>
                    ${['Placement Officer', 'HOD', 'Other'  ]
                        .map(desig => `<option value="${desig}" ${currentValue === desig ? 'selected' : ''}>${desig}</option>`)
                        .join('')}
                </select>
            `;
        } else {
            cell.innerHTML = `<input type="text" value="${currentValue}">`;
        }
    }
    
    button.textContent = 'Save';
    button.onclick = () => saveFaculty(button);
    
    // Disable other edit buttons while editing
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        if (btn !== button) btn.disabled = true;
    });
}

async function saveFaculty(button) {
    const row = button.closest('tr');
    const facultyId = row.dataset.id;
    
    const updatedFaculty = {
        name: row.cells[0].querySelector('input').value,
        department: row.cells[1].querySelector('select').value,
        designation: row.cells[2].querySelector('select').value,
        accessCode: row.cells[3].querySelector('input').value,
        phone: row.cells[4].querySelector('input').value
    };
    
    try {
        const response = await fetch(`/update-faculty/${facultyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedFaculty)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update the row with new values
            row.cells[0].textContent = updatedFaculty.name;
            row.cells[1].textContent = updatedFaculty.department;
            row.cells[2].textContent = updatedFaculty.designation;
            row.cells[3].textContent = updatedFaculty.accessCode;
            row.cells[4].textContent = updatedFaculty.phone;
            
            button.textContent = 'Edit';
            button.onclick = () => editFaculty(button);
            
            // Re-enable other edit buttons
            const editButtons = document.querySelectorAll('.edit-btn');
            editButtons.forEach(btn => btn.disabled = false);
        } else {
            alert(result.message || 'Error updating faculty member');
        }
    } catch (err) {
        console.error('Error updating faculty:', err);
        alert('Error updating faculty member');
    }
}

async function deleteFaculty(facultyId, button) {
    if (!confirm('Are you sure you want to delete this faculty member?')) {
        return;
    }
    
    try {
        const response = await fetch(`/delete-faculty/${facultyId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove the row from the table
            const row = button.closest('tr');
            row.remove();
        } else {
            alert(result.message || 'Error deleting faculty member');
        }
    } catch (err) {
        console.error('Error deleting faculty:', err);
        alert('Error deleting faculty member');
    }
}

// Add form validation
document.querySelector('.faculty-form')?.addEventListener('submit', function(e) {
    const phone = document.getElementById('phone').value;
    const accessCode = document.getElementById('accessCode').value;
    
    // Basic phone number validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        e.preventDefault();
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    // Basic access code validation
    if (accessCode.length < 4) {
        e.preventDefault();
        alert('Access code must be at least 4 characters long');
        return;
   
    }
});