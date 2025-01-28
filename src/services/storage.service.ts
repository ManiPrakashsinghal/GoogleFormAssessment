import { Form, FormResponse } from "../models/form.model";

class StorageService {
  private readonly FORMS_KEY = 'forms';
  private readonly RESPONSES_KEY = 'form_responses';

  // Save form to localStorage
  saveForm(form: Form): void {
    const forms = this.getAllForms();
    const existingFormIndex = forms.findIndex(f => f.id === form.id);
    
    if (existingFormIndex >= 0) {
      forms[existingFormIndex] = form;
    } else {
      forms.push(form);
    }
    
    localStorage.setItem(this.FORMS_KEY, JSON.stringify(forms));
  }

  // Get all forms from localStorage
  getAllForms(): Form[] {
    const forms = localStorage.getItem(this.FORMS_KEY);
    return forms ? JSON.parse(forms) : [];
  }

  // Get single form by ID
  getFormById(id: string): Form | null {
    const forms = this.getAllForms();
    return forms.find(form => form.id === id) || null;
  }

  // Delete form
  deleteForm(id: string): void {
    const forms = this.getAllForms().filter(form => form.id !== id);
    localStorage.setItem(this.FORMS_KEY, JSON.stringify(forms));
  }

  // Save form response
  saveFormResponse(response: FormResponse): void {
    const responses = this.getFormResponses(response.formId);
    responses.push(response);
    localStorage.setItem(`${this.RESPONSES_KEY}_${response.formId}`, JSON.stringify(responses));
  }

  // Get form responses
  getFormResponses(formId: string): FormResponse[] {
    const responses = localStorage.getItem(`${this.RESPONSES_KEY}_${formId}`);
    return responses ? JSON.parse(responses) : [];
  }
}

export const storageService = new StorageService();
