
import { Form, Field, FormResponse } from './models/form.model';
import { storageService } from './services/storage.service';

class FormBuilder {
  private currentForm: Form | null = null;
  private formsListElement: HTMLElement;
  private formBuilderElement: HTMLElement;
  private fieldsContainer: HTMLElement;

  constructor() {
    this.formsListElement = document.getElementById('forms-list')!;
    this.formBuilderElement = document.getElementById('form-builder')!;
    this.fieldsContainer = document.getElementById('fields-container')!;
    
    this.initializeEventListeners();
    this.renderFormsList();
  }

  private initializeEventListeners(): void {
    // Add new form button
    const addFieldBtn = document.getElementById('add-field');
    addFieldBtn?.addEventListener('click', () => this.addNewField());

    // Form submission
    const formDetails = document.getElementById('form-details');
    formDetails?.addEventListener('submit', (e) => this.handleFormSubmit(e));

    // Cancel form button
    const cancelFormBtn = document.getElementById('cancel-form');
    cancelFormBtn?.addEventListener('click', () => this.cancelForm());
  }

  private addNewField(): void {
    const fieldId = crypto.randomUUID();
    const fieldElement = document.createElement('div');
    fieldElement.className = 'field-item';
    fieldElement.innerHTML = `
      <div class="form-group">
        <label for="field-label-${fieldId}">Field Label</label>
        <input type="text" id="field-label-${fieldId}" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="field-type-${fieldId}">Field Type</label>
        <select id="field-type-${fieldId}" class="form-control">
          <option value="text">Text</option>
          <option value="radio">Radio Group</option>
          <option value="checkbox">Checkbox</option>
        </select>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="field-required-${fieldId}"> Required
        </label>
      </div>
      <div class="options-container" id="options-${fieldId}" style="display: none;">
        <div class="form-group">
          <label>Options (one per line)</label>
          <textarea class="form-control" rows="3"></textarea>
        </div>
      </div>
      <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Remove Field</button>
    `;

    const typeSelect = fieldElement.querySelector(`#field-type-${fieldId}`) as HTMLSelectElement;
    const optionsContainer = fieldElement.querySelector(`#options-${fieldId}`) as HTMLElement;

    typeSelect.addEventListener('change', () => {
      optionsContainer.style.display = 
        ['radio', 'checkbox'].includes(typeSelect.value) ? 'block' : 'none';
    });

    this.fieldsContainer.appendChild(fieldElement);
  }

  private async handleFormSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const titleInput = document.getElementById('form-title') as HTMLInputElement;
    const descriptionInput = document.getElementById('form-description') as HTMLTextAreaElement;

    const form: Form = {
      id: this.currentForm?.id || crypto.randomUUID(),
      title: titleInput.value,
      description: descriptionInput.value,
      fields: this.collectFormFields(),
      createdAt: this.currentForm?.createdAt || new Date(),
      updatedAt: new Date()
    };

    storageService.saveForm(form);
    this.renderFormsList();
    this.cancelForm();
  }

  private collectFormFields(): Field[] {
    const fields: Field[] = [];
    const fieldElements = this.fieldsContainer.getElementsByClassName('field-item');

    Array.from(fieldElements).forEach((element, index) => {
      const fieldId = crypto.randomUUID();
      const labelInput = element.querySelector('input[id^="field-label-"]') as HTMLInputElement;
      const typeSelect = element.querySelector('select[id^="field-type-"]') as HTMLSelectElement;
      const requiredCheckbox = element.querySelector('input[id^="field-required-"]') as HTMLInputElement;
      const optionsTextarea = element.querySelector('.options-container textarea') as HTMLTextAreaElement;

      const field: Field = {
        id: fieldId,
        type: typeSelect.value as 'text' | 'radio' | 'checkbox',
        label: labelInput.value,
        required: requiredCheckbox.checked,
        order: index,
        options: ['radio', 'checkbox'].includes(typeSelect.value)
          ? optionsTextarea.value.split('\n').filter(option => option.trim())
          : undefined
      };

      fields.push(field);
    });

    return fields;
  }

  private cancelForm(): void {
    (document.getElementById('form-details') as HTMLFormElement).reset();
    this.fieldsContainer.innerHTML = '';
    this.formBuilderElement.style.display = 'none';
    this.currentForm = null;
  }

  private renderFormsList(): void {
    const forms = storageService.getAllForms();
    
    this.formsListElement.innerHTML = `
      <div class="form-card">
        <button class="btn btn-primary" onclick="document.getElementById('form-builder').style.display='block'">
          Create New Form
        </button>
      </div>
      ${forms.map(form => `
        <div class="form-card">
          <h3>${form.title}</h3>
          <p>${form.description}</p>
          <div class="button-group">
            <button class="btn btn-secondary" onclick="window.formBuilder.editForm('${form.id}')">
              Edit
            </button>
            <button class="btn btn-secondary" onclick="window.formBuilder.previewForm('${form.id}')">
              Preview
            </button>
            <button class="btn btn-danger" onclick="window.formBuilder.deleteForm('${form.id}')">
              Delete
            </button>
          </div>
        </div>
      `).join('')}
    `;
  }

  public deleteForm(formId: string): void {
    if (confirm('Are you sure you want to delete this form?')) {
      storageService.deleteForm(formId);
      this.renderFormsList();
    }
  }

  public editForm(formId: string): void {
    this.currentForm = storageService.getFormById(formId);
    if (!this.currentForm) return;

    (document.getElementById('form-title') as HTMLInputElement).value = this.currentForm.title;
    (document.getElementById('form-description') as HTMLTextAreaElement).value = this.currentForm.description;

    this.fieldsContainer.innerHTML = '';
    this.currentForm.fields.forEach(field => {
      const fieldElement = document.createElement('div');
      fieldElement.className = 'field-item';
      
      const fieldId = field.id;
      fieldElement.innerHTML = `
        <div class="form-group">
          <label for="field-label-${fieldId}">Field Label</label>
          <input type="text" id="field-label-${fieldId}" class="form-control" value="${field.label}" required>
        </div>
        <div class="form-group">
          <label for="field-type-${fieldId}">Field Type</label>
          <select id="field-type-${fieldId}" class="form-control">
            <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
            <option value="radio" ${field.type === 'radio' ? 'selected' : ''}>Radio Group</option>
            <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="field-required-${fieldId}" ${field.required ? 'checked' : ''}> Required
          </label>
        </div>
        <div class="options-container" id="options-${fieldId}" style="display: ${['radio', 'checkbox'].includes(field.type) ? 'block' : 'none'};">
          <div class="form-group">
            <label>Options (one per line)</label>
            <textarea class="form-control" rows="3">${field.options?.join('\n') || ''}</textarea>
          </div>
        </div>
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">Remove Field</button>
      `;

      const typeSelect = fieldElement.querySelector(`#field-type-${fieldId}`) as HTMLSelectElement;
      const optionsContainer = fieldElement.querySelector(`#options-${fieldId}`) as HTMLElement;

      typeSelect.addEventListener('change', () => {
        optionsContainer.style.display = 
          ['radio', 'checkbox'].includes(typeSelect.value) ? 'block' : 'none';
      });

      this.fieldsContainer.appendChild(fieldElement);
    });

    this.formBuilderElement.style.display = 'block';
  }

  public previewForm(formId: string): void {
    const form = storageService.getFormById(formId);
    if (!form) return;

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'form-preview form-card';
    previewContainer.innerHTML = `
      <div class="preview-header">
        <h2>${form.title}</h2>
        <p>${form.description}</p>
      </div>
      <form id="preview-form-${form.id}" class="preview-form">
        ${form.fields.map(field => this.renderPreviewField(field)).join('')}
        <div class="form-group">
          <button type="submit" class="btn btn-primary">Submit</button>
          <button type="button" class="btn btn-secondary" onclick="window.formBuilder.closePreview()">Close</button>
        </div>
      </form>
    `;

    // Hide the forms list and show preview
    this.formsListElement.style.display = 'none';
    this.formBuilderElement.style.display = 'none';
    document.querySelector('.container')?.appendChild(previewContainer);

    // Add submit event listener
    const previewForm = document.getElementById(`preview-form-${form.id}`);
    previewForm?.addEventListener('submit', (e) => this.handlePreviewSubmit(e, form));
  }

  private renderPreviewField(field: Field): string {
    let fieldHtml = `
      <div class="form-group">
        <label for="field-${field.id}">
          ${field.label}
          ${field.required ? '<span class="required">*</span>' : ''}
        </label>
    `;

    switch (field.type) {
      case 'text':
        fieldHtml += `
          <input 
            type="text" 
            id="field-${field.id}" 
            class="form-control" 
            ${field.required ? 'required' : ''}
          >
        `;
        break;

      case 'radio':
        fieldHtml += field.options?.map(option => `
          <div class="radio-option">
            <input 
              type="radio" 
              name="field-${field.id}" 
              id="option-${field.id}-${option}" 
              value="${option}"
              ${field.required ? 'required' : ''}
            >
            <label for="option-${field.id}-${option}">${option}</label>
          </div>
        `).join('') || '';
        break;

      case 'checkbox':
        fieldHtml += field.options?.map(option => `
          <div class="checkbox-option">
            <input 
              type="checkbox" 
              name="field-${field.id}" 
              id="option-${field.id}-${option}" 
              value="${option}"
            >
            <label for="option-${field.id}-${option}">${option}</label>
          </div>
        `).join('') || '';
        break;
    }

    fieldHtml += '</div>';
    return fieldHtml;
  }

  private async handlePreviewSubmit(e: Event, form: Form): Promise<void> {
    e.preventDefault();
    
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    const responses: { fieldId: string; value: string | string[] }[] = [];

    form.fields.forEach(field => {
      if (field.type === 'checkbox') {
        const checkboxes = formElement.querySelectorAll(`input[name="field-${field.id}"]:checked`);
        const values = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
        responses.push({ fieldId: field.id, value: values });
      } else {
        const value = formData.get(`field-${field.id}`);
        if (value) {
          responses.push({ fieldId: field.id, value: value.toString() });
        }
      }
    });

    const formResponse: FormResponse = {
      id: crypto.randomUUID(),
      formId: form.id,
      responses,
      submittedAt: new Date()
    };

    storageService.saveFormResponse(formResponse);
    alert('Form submitted successfully!');
    this.closePreview();
  }

  public closePreview(): void {
    const previewContainer = document.querySelector('.form-preview');
    previewContainer?.remove();
    this.formsListElement.style.display = 'block';
  }

}

// Initialize the application
window.formBuilder = new FormBuilder();