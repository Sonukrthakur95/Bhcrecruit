import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addClient, subscribeToClients, updateClient } from "../lib/api";
import { Client, PaymentTerms, Currency } from "../types";
import { 
  Building2, 
  Plus, 
  Search, 
  Globe, 
  CreditCard, 
  DollarSign, 
  MapPin, 
  Loader2, 
  CheckCircle,
  X,
  Edit,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

const clientSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  paymentTerms: z.enum(["Net 15", "Net 30", "Net 45", "Advance Payment"]),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED"]),
  country: z.string().min(2, "Country is required"),
  countries: z.array(z.string()).min(1, "Select at least one country"),
  industries: z.array(z.string()).min(1, "Select one industry"),
  website: z.string().url().or(z.literal("")).optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().or(z.literal("")).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const PAYMENT_TERMS: PaymentTerms[] = ["Net 15", "Net 30", "Net 45", "Advance Payment"];
const CURRENCIES: Currency[] = ["INR", "USD", "EUR", "GBP", "AED"];
const COUNTRIES = ["India", "USA", "UK", "UAE", "Germany", "Singapore", "Australia", "Canada"];
const INDUSTRIES = ["Tech", "Fintech", "Health", "E-commerce", "Consulting", "Finance"];

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    return subscribeToClients(setClients);
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      countries: [],
      industries: [],
    }
  });

  const selectedCountries = watch("countries") || [];
  const selectedIndustries = watch("industries") || [];

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data);
      } else {
        await addClient(data as any);
      }
      reset();
      setShowForm(false);
      setEditingClient(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save client");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setValue("name", client.name);
    setValue("paymentTerms", client.paymentTerms);
    setValue("currency", client.currency);
    setValue("country", client.country);
    setValue("countries", client.countries);
    setValue("industries", client.industries);
    setValue("website", client.website || "");
    setValue("contactPerson", client.contactPerson || "");
    setValue("contactEmail", client.contactEmail || "");
    setShowForm(true);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Management</h1>
          <p className="text-slate-500">Manage global clients and their payment terms</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingClient(null); reset(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-blue-100"
        >
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <motion.div
            key={client.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Building2 className="w-6 h-6" />
              </div>
              <button 
                onClick={() => handleEdit(client)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{client.name}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <Globe className="w-4 h-4" />
              {client.country}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment:
                </span>
                <span className="font-semibold text-slate-700">{client.paymentTerms}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Currency:
                </span>
                <span className="font-semibold text-slate-700">{client.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Reach:
                </span>
                <span className="font-semibold text-slate-700">{client.countries.length} Countries</span>
              </div>
            </div>

            {client.website && (
              <a 
                href={client.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 py-2 rounded-lg hover:bg-blue-100 transition-all"
              >
                Visit Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingClient ? "Edit Client" : "Add New Client"}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Client Name</label>
                    <input
                      {...register("name")}
                      placeholder="e.g. Google India"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
                    <input
                      {...register("website")}
                      placeholder="https://client.com"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Payment Terms</label>
                    <select
                      {...register("paymentTerms")}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      {PAYMENT_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Currency</label>
                    <select
                      {...register("currency")}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      {CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Primary Country</label>
                    <select
                      {...register("country")}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Global Presence (Multi)</label>
                    <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-xl min-h-[42px]">
                      {COUNTRIES.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            const current = selectedCountries;
                            const next = current.includes(c) ? current.filter(x => x !== c) : [...current, c];
                            setValue("countries", next);
                          }}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all",
                            selectedCountries.includes(c) 
                              ? "bg-blue-600 text-white" 
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">Industries</label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => {
                          const current = selectedIndustries;
                          const next = current.includes(ind) ? current.filter(x => x !== ind) : [...current, ind];
                          setValue("industries", next);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                          selectedIndustries.includes(ind)
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-500"
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="py-3 px-6 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 px-6 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {editingClient ? "Update Client" : "Save Client"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
