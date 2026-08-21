import React, { useMemo } from 'react';
import { Asset, AssetStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { AlertTriangle, Euro, Laptop, Activity } from 'lucide-react';

interface DashboardProps {
  assets: Asset[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c'];

const Dashboard: React.FC<DashboardProps> = ({ assets }) => {
  const stats = useMemo(() => {
    const active = assets.filter(a => a.status === AssetStatus.PRODUCTION);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const expired = active.filter(a => {
      if (!a.endDate) return false;
      const isUnderRenewal = a.renewalChecklist && a.renewalChecklist.some(c => !c);
      return !isUnderRenewal && new Date(a.endDate) <= today;
    });
    const expiringSoon = active.filter(a => {
      if (!a.endDate) return false;
      const isUnderRenewal = a.renewalChecklist && a.renewalChecklist.some(c => !c);
      if (isUnderRenewal) return false;
      const end = new Date(a.endDate);
      return end > today && end <= in30Days;
    });

    const totalCostExVat = active.reduce((acc, curr) => acc + Number(curr.monthlyValueExvat), 0);

    // Data for charts
    const statusCounts = assets.reduce((acc, curr) => {
      const isUnderRenewal = curr.renewalChecklist && curr.renewalChecklist.some(c => !c);
      const statusLabel = isUnderRenewal ? 'Em Renovação' : curr.status;
      acc[statusLabel] = (acc[statusLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const companyCounts = assets.reduce((acc, curr) => {
      acc[curr.company] = (acc[curr.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: assets.length,
      activeCount: active.length,
      expiredCount: expired.length,
      expiringCount: expiringSoon.length,
      expiringList: expiringSoon,
      expiredList: expired,
      monthlyCost: totalCostExVat,
      chartStatus: Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] })),
      chartCompany: Object.keys(companyCounts).map(k => ({ name: k, value: companyCounts[k] }))
    };
  }, [assets]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Ativos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.activeCount}</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-full text-blue-600">
            <Activity size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">A Expirar (30d)</p>
            <p className={`text-2xl font-bold ${stats.expiringCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {stats.expiringCount}
            </p>
          </div>
          <div className={`p-2 rounded-full ${stats.expiringCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Expirados</p>
            <p className={`text-2xl font-bold ${stats.expiredCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.expiredCount}
            </p>
          </div>
          <div className={`p-2 rounded-full ${stats.expiredCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Custo Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.monthlyCost.toFixed(0)}€</p>
          </div>
          <div className="p-2 bg-green-50 rounded-full text-green-600">
            <Euro size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="p-2 bg-purple-50 rounded-full text-purple-600">
            <Laptop size={20} />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.expiredCount > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-tight">Crítico: Contratos Expirados ({stats.expiredCount})</h3>
                <ul className="mt-2 text-xs text-red-700 space-y-1">
                  {stats.expiredList.map(item => (
                    <li key={item.id} className="list-disc ml-4 font-medium">
                      {item.consultantName} - {item.equipmentSpecs}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {stats.expiringCount > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-3" />
              <div>
                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-tight">Aviso: Renovações em 30 dias ({stats.expiringCount})</h3>
                <ul className="mt-2 text-xs text-amber-700 space-y-1">
                  {stats.expiringList.map(item => (
                    <li key={item.id} className="list-disc ml-4 font-medium">
                      {item.consultantName} - {item.equipmentSpecs} ({new Date(item.endDate).toLocaleDateString('pt-PT')})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribuição por Estado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {stats.chartStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ativos por Empresa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.chartCompany}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} fontSize={12}/>
                <YAxis allowDecimals={false}/>
                <Tooltip />
                <Bar dataKey="value" fill="#0078D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
