
import { MockEmail } from '../types';

const generateRandomId = () => Math.random().toString(36).substring(2, 10);

const mockEmails: MockEmail[] = [
  {
    id: generateRandomId(),
    sender: 'support@yourbank.com',
    subject: 'Urgent: Your account has been suspended!',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    attachments: [
      { id: generateRandomId(), fileName: 'unlock_account_details.html.zip', fileSize: 28 * 1024, isMalicious: true },
    ],
  },
  {
    id: generateRandomId(),
    sender: 'HR Department',
    subject: 'Company Picnic Photos',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    attachments: [
      { id: generateRandomId(), fileName: 'picnic_fun_2024.jpg', fileSize: 2.5 * 1024 * 1024, isMalicious: false },
      { id: generateRandomId(), fileName: 'group_photo.jpg', fileSize: 3.1 * 1024 * 1024, isMalicious: false },
    ],
  },
  {
    id: generateRandomId(),
    sender: 'Nigerian Prince',
    subject: 'I need your help!',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    attachments: [
      { id: generateRandomId(), fileName: 'business_proposal.doc.exe', fileSize: 120 * 1024, isMalicious: true },
    ],
  },
  {
    id: generateRandomId(),
    sender: 'jane.doe@example.com',
    subject: 'Project Invoice',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    attachments: [
      { id: generateRandomId(), fileName: 'invoice_Q3_final.pdf', fileSize: 450 * 1024, isMalicious: false },
    ],
  },
];

export const fetchMockEmails = async (): Promise<MockEmail[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockEmails);
    }, 1000);
  });
};

export const deleteMockAttachment = async (emailId: string, attachmentId: string): Promise<boolean> => {
    console.log(`Simulating deletion of attachment ${attachmentId} from email ${emailId}`);
    const email = mockEmails.find(e => e.id === emailId);
    if (email) {
        email.attachments = email.attachments.filter(a => a.id !== attachmentId);
    }
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
};
