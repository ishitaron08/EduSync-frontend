import { AxiosRequestConfig } from "axios";
import api from "@/lib/api";

export async function getApi<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}

export async function postApi<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.post<T>(url, payload, config);
  return data;
}

export async function patchApi<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.patch<T>(url, payload, config);
  return data;
}

export async function putApi<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.put<T>(url, payload, config);
  return data;
}

export async function deleteApi<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.delete<T>(url, config);
  return data;
}
