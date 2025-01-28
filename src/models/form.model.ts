
interface Field {
    id: string;
    type: 'text' | 'radio' | 'checkbox';
    label: string;
    options?: string[];
    required: boolean;
    order: number;
  }
  
  interface Form {
    id: string;
    title: string;
    description: string;
    fields: Field[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  interface FormResponse {
    id: string;
    formId: string;
    responses: {
      fieldId: string;
      value: string | string[];
    }[];
    submittedAt: Date;
  }
  
  export { Field, Form, FormResponse };