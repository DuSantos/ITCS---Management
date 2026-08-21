import React from 'react';
import { Subscription, SubscriptionType, SubscriptionPortal } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Key, Users, BookOpen, Activity } from 'lucide-react';

interface SubscriptionDashboardProps {
  subscriptions: Subscription[];
}

const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({ subscriptions }) => {
  const activeSubscriptions = subscriptions.filter(s => !s.project?.toLowerCase().includes('no license'));

  const totalM365 = activeSubscriptions.filter(s => s.type === SubscriptionType.M365_APPS).length;
  const totalCopilot = activeSubscriptions.filter(s => s.type === SubscriptionType.COPILOT).length;
  const totalVS = activeSubscriptions.filter(s => s.type === SubscriptionType.VISUAL_STUDIO).length;
  const totalClaude = activeSubscriptions.filter(s => s.type === SubscriptionType.CLAUDE_AI).length;

  const vsMoongy = activeSubscriptions.filter(s => s.type === SubscriptionType.VISUAL_STUDIO && s.portal === SubscriptionPortal.MOONGY).length;
  const vsKCSIT = activeSubscriptions.filter(s => s.type === SubscriptionType.VISUAL_STUDIO && s.portal === SubscriptionPortal.KCSIT).length;
  const vsCompradas = activeSubscriptions.filter(s => s.type === SubscriptionType.VISUAL_STUDIO && s.portal === SubscriptionPortal.COMPRADAS).length;

  const MOONGY_TOTAL = 50; // 25 + 25
  const KCSIT_TOTAL = 15;

  const byAppType = [
    { name: 'M365 Apps', value: totalM365 },
    { name: 'Copilot', value: totalCopilot },
    { name: 'Visual Studio', value: totalVS },
    { name: 'Claude AI', value: totalClaude },
  ];

  const vsUsage = [
    { name: 'Moongy', Atribuidas: vsMoongy, Disponiveis: MOONGY_TOTAL - vsMoongy },
    { name: 'KCSIT', Atribuidas: vsKCSIT, Disponiveis: KCSIT_TOTAL - vsKCSIT },
  ];

  const COLORS = ['#0078D4', '#107C10', '#5C2D91', '#D97706'];

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">M365 Apps</p>
            <p className="text-2xl font-bold text-gray-900">{totalM365}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Copilot 365</p>
            <p className="text-2xl font-bold text-gray-900">{totalCopilot}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <Key size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Visual Studio</p>
            <p className="text-2xl font-bold text-gray-900">{totalVS}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Claude AI</p>
            <p className="text-2xl font-bold text-gray-900">{totalClaude}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - All Subscriptions */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Licenças por Aplicação</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byAppType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {byAppType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} licenças`, 'Total']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Visual Studio Portals */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Disponibilidade Visual Studio</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vsUsage}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Atribuidas" stackId="a" fill="#5C2D91" name="Atribuídas" />
                <Bar dataKey="Disponiveis" stackId="a" fill="#E1DFDD" name="Disponíveis" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-800 font-medium">Portal Moongy</p>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-purple-600">Atribuídas: {vsMoongy}</span>
                <span className="text-xs font-bold text-purple-900">Livres: {MOONGY_TOTAL - vsMoongy}</span>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Portal KCSIT</p>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-blue-600">Atribuídas: {vsKCSIT}</span>
                <span className="text-xs font-bold text-blue-900">Livres: {KCSIT_TOTAL - vsKCSIT}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            * Licenças "Compradas" ({vsCompradas}) não têm limite definido no portal.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDashboard;
