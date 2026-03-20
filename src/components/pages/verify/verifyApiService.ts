import axios from "axios";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface ClearanceVerificationResult {
  residentName: string;
  clearanceNumber: string;
  purpose: string;
  status: string;
  issuedAt: string;
  expiryDate: string;
  isExpired: boolean;
}

export const verifyClearance = async (clearanceNumber: string) => {
  return axios.get<ClearanceVerificationResult>(
    `${backendUrl}/app-one-backend/clearance-requests/verify/${clearanceNumber}`
  );
};
