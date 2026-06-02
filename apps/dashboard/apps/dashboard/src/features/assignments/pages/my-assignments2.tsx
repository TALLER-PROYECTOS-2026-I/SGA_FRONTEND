"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Star,
  Award,
  Target,
  Zap,
} from "lucide-react";

interface MetricCard {
  title: string;
  value: number | string;
  trend: number;
  icon: any;
  color: string;
  description: string;
}

interface ActivityItem {
  id: string;
  type: "syllabus" | "evaluation" | "assignment" | "comment";
  title: string;
  description: string;
  timestamp: Date;
  status: "completed" | "pending" | "in_progress";
  user: string;
}

interface PerformanceData {
  month: string;
  completions: number;
  approvals: number;
  revisions: number;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState<"bar" | "line" | "pie">("bar");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Datos simulados para métricas principales
  const metrics: MetricCard[] = useMemo(() => {
    const baseMetrics = [
      {
        title: "Total Sílabos",
        value: 234,
        trend: 12.5,
        icon: BookOpen,
        color: "bg-blue-500",
        description: "Sílabos creados este período",
      },
      {
        title: "Tasa de Aprobación",
        value: "78.3%",
        trend: 5.2,
        icon: CheckCircle,
        color: "bg-green-500",
        description: "Porcentaje de sílabos aprobados",
      },
      {
        title: "Docentes Activos",
        value: 45,
        trend: -2.1,
        icon: Users,
        color: "bg-purple-500",
        description: "Docentes con actividad reciente",
      },
      {
        title: "Revisiones Pendientes",
        value: 23,
        trend: -8.3,
        icon: Clock,
        color: "bg-yellow-500",
        description: "Sílabos en espera de revisión",
      },
      {
        title: "Promedio Revisión",
        value: "3.2 días",
        trend: -15.4,
        icon: Activity,
        color: "bg-indigo-500",
        description: "Tiempo promedio de revisión",
      },
      {
        title: "Calidad Promedio",
        value: "8.7/10",
        trend: 4.1,
        icon: Star,
        color: "bg-pink-500",
        description: "Score de calidad de sílabos",
      },
    ];

    if (timeRange === "week") {
      return baseMetrics.map(m => ({
        ...m,
        value: typeof m.value === "number" ? Math.floor(m.value * 0.3) : m.value,
        trend: m.trend * 0.8,
      }));
    } else if (timeRange === "year") {
      return baseMetrics.map(m => ({
        ...m,
        value: typeof m.value === "number" ? m.value * 2.5 : m.value,
        trend: m.trend * 1.2,
      }));
    }
    return baseMetrics;
  }, [timeRange]);

  // Datos de rendimiento mensual
  const performanceData: PerformanceData[] = useMemo(() => {
    const data = {
      month: [
        { month: "Ene", completions: 45, approvals: 38, revisions: 12 },
        { month: "Feb", completions: 52, approvals: 44, revisions: 15 },
        { month: "Mar", completions: 48, approvals: 42, revisions: 10 },
        { month: "Abr", completions: 61, approvals: 55, revisions: 18 },
        { month: "May", completions: 58, approvals: 52, revisions: 14 },
        { month: "Jun", completions: 67, approvals: 61, revisions: 16 },
      ],
      week: [
        { month: "Lun", completions: 12, approvals: 10, revisions: 3 },
        { month: "Mar", completions: 15, approvals: 13, revisions: 4 },
        { month: "Mié", completions: 18, approvals: 16, revisions: 5 },
        { month: "Jue", completions: 14, approvals: 12, revisions: 3 },
        { month: "Vie", completions: 20, approvals: 18, revisions: 6 },
        { month: "Sáb", completions: 8, approvals: 7, revisions: 2 },
        { month: "Dom", completions: 5, approvals: 4, revisions: 1 },
      ],
      year: [
        { month: "2022", completions: 320, approvals: 280, revisions: 85 },
        { month: "2023", completions: 412, approvals: 365, revisions: 102 },
        { month: "2024", completions: 245, approvals: 220, revisions: 58 },
      ],
    };
    return data[timeRange];
  }, [timeRange]);

  // Actividad reciente simulada
  const recentActivity: ActivityItem[] = useMemo(() => {
    const activities = [
      {
        id: "1",
        type: "syllabus" as const,
        title: "Nuevo sílabo creado",
        description: "Matemáticas Avanzadas - Prof. García",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: "completed" as const,
        user: "Ana García",
      },
      {
        id: "2",
        type: "evaluation" as const,
        title: "Evaluación completada",
        description: "Física I - 95% de aprobación",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        status: "completed" as const,
        user: "Carlos Ruiz",
      },
      {
        id: "3",
        type: "assignment" as const,
        title: "Nueva asignación",
        description: "Química Orgánica asignada a Dra. López",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "pending" as const,
        user: "Sistema",
      },
      {
        id: "4",
        type: "comment" as const,
        title: "Comentario agregado",
        description: "Revisión de sílabo de Programación Web",
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
        status: "in_progress" as const,
        user: "María Torres",
      },
      {
        id: "5",
        type: "syllabus" as const,
        title: "Sílabo actualizado",
        description: "Bases de Datos - Versión 2.1",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "completed" as const,
        user: "Jorge Mendoza",
      },
      {
        id: "6",
        type: "evaluation" as const,
        title: "Revisión en progreso",
        description: "Inteligencia Artificial - 75% completado",
        timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
        status: "in_progress" as const,
        user: "Laura Silva",
      },
    ];
    return activities.slice((currentPage - 1) * 5, currentPage * 5);
  }, [currentPage]);

  const totalActivityPages = Math.ceil(6 / 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "in_progress":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "syllabus":
        return BookOpen;
      case "evaluation":
        return CheckCircle;
      case "assignment":
        return Users;
      default:
        return AlertCircle;
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const handleExport = () => {
    const data = {
      metrics,
      performanceData,
      timestamp: new Date().toISOString(),
      timeRange,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${timeRange}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Renderizado de gráfico simple (barras)
  const renderChart = () => {
    const maxValue = Math.max(...performanceData.map(d => Math.max(d.completions, d.approvals, d.revisions)));
    
    return (
      <div className="h-64 mt-4">
        <div className="flex h-full items-end gap-2">
          {performanceData.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex flex-col items-center gap-1">
                <div
                  className="w-full bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                  style={{ height: `${(data.approvals / maxValue) * 180}px` }}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                    {data.approvals}
                  </div>
                </div>
                <div
                  className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                  style={{ height: `${(data.completions / maxValue) * 140}px` }}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                    {data.completions}
                  </div>
                </div>
                <div
                  className="w-full bg-yellow-500 rounded-t transition-all duration-500 hover:bg-yellow-600"
                  style={{ height: `${(data.revisions / maxValue) * 100}px` }}
                />
              </div>
              <div className="text-xs font-medium text-gray-600 mt-2">{data.month}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Aprobados</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Completados</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>Revisiones</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Panel de Análisis
              </h1>
              <p className="text-gray-500 mt-1">Métricas y rendimiento del sistema de sílabos</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Actualizar
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                Exportar Datos
              </button>
            </div>
          </div>
        </div>

        {/* Filtros y controles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Rango de tiempo:</span>
              <div className="flex gap-2">
                {(["week", "month", "year"] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                      timeRange === range
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {range === "week" ? "Semana" : range === "month" ? "Mes" : "Año"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(["bar", "line", "pie"] as const).map(chart => (
                  <button
                    key={chart}
                    onClick={() => setSelectedChart(chart)}
                    className={`p-1.5 rounded-md transition-all ${
                      selectedChart === chart ? "bg-white shadow-sm" : "text-gray-500"
                    }`}
                  >
                    {chart === "bar" && <BarChart3 className="w-4 h-4" />}
                    {chart === "line" && <LineChart className="w-4 h-4" />}
                    {chart === "pie" && <PieChart className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  <option value="science">Ciencias</option>
                  <option value="engineering">Ingeniería</option>
                  <option value="humanities">Humanidades</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {metric.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${metric.trend > 0 ? "text-green-600" : "text-red-600"}`}>
                      {Math.abs(metric.trend)}% vs período anterior
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{metric.description}</p>
                </div>
                <div className={`${metric.color} p-3 rounded-lg text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <metric.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico y Actividad Reciente en grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Rendimiento de Sílabos</h3>
                <p className="text-sm text-gray-500">Comparativa de completados, aprobados y revisiones</p>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-500">Tendencia positiva</span>
              </div>
            </div>
            {renderChart()}
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivity.map(activity => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{activity.user}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">
                          {activity.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalActivityPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-gray-500">
                  Página {currentPage} de {totalActivityPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalActivityPages, p + 1))}
                  disabled={currentPage === totalActivityPages}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logros y Metas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Logros Destacados</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Sílabos aprobados este mes</span>
                <span className="text-lg font-bold text-green-600">+42%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "78%" }} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-700">Participación docente</span>
                <span className="text-lg font-bold text-blue-600">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Metas del Trimestre</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Meta de aprobación</span>
                  <span className="font-medium text-gray-900">65/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "65%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Cobertura de cursos</span>
                  <span className="font-medium text-gray-900">48/60</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: "80%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Datos actualizados al {new Date().toLocaleDateString()} • Próxima actualización en 2 horas</p>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Actualizando datos...</span>
          </div>
        </div>
      )}
    </div>
  );
}