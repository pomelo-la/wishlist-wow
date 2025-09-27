'use client';

import { useState, useMemo, useEffect } from 'react';
import KanbanCard from './KanbanCard';
import EvaluationView from '@/components/evaluation/EvaluationView';
import { Plus, Filter, MoreHorizontal } from 'lucide-react';
import { Initiative } from '@/types/initiative';
import { apiService, Initiative as ApiInitiative } from '@/services/api';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface KanbanBoardProps {
  searchQuery?: string;
}

interface DroppableColumnProps {
  status: string;
  title: string;
  headerColor: string;
  children: React.ReactNode;
  initiativeCount: number;
}

function DroppableColumn({ status, title, headerColor, children, initiativeCount }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 bg-gray-100 mx-2 my-4 rounded-lg shadow-sm ${
        isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`${headerColor} px-4 py-3 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {title}
            </h3>
            <span className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
              {initiativeCount}
            </span>
          </div>
          <button className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors">
            <Plus size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Column Content */}
      <div className="p-3 space-y-3 h-[calc(100%-4rem)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default function KanbanBoard({ searchQuery = '' }: KanbanBoardProps) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [selectedInitiativeForEvaluation, setSelectedInitiativeForEvaluation] = useState<Initiative | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load initiatives from API
  useEffect(() => {
    const loadInitiatives = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getInitiatives({ limit: 100 });
        const mappedInitiatives = response.data.map(mapApiInitiativeToInitiative);
        setInitiatives(mappedInitiatives);
      } catch (err) {
        console.error('Error loading initiatives:', err);
        setError(err instanceof Error ? err.message : 'Error loading initiatives');
      } finally {
        setLoading(false);
      }
    };

    loadInitiatives();
  }, []);

  // Map API initiative to frontend initiative format
  const mapApiInitiativeToInitiative = (apiInitiative: ApiInitiative): Initiative => {
    return {
      id: apiInitiative.id,
      title: apiInitiative.title,
      description: apiInitiative.description,
      status: apiInitiative.status,
      createdBy: apiInitiative.created_by,
      createdAt: new Date(apiInitiative.created_at),
      updatedAt: new Date(apiInitiative.updated_at),
      quarter: apiInitiative.quarter,
      score: apiInitiative.score,
      category: apiInitiative.category,
      vertical: apiInitiative.vertical,
      clientType: apiInitiative.client_type,
      country: apiInitiative.country,
      systemicRisk: apiInitiative.systemic_risk,
      economicImpact: apiInitiative.economic_impact,
      economicImpactDescription: apiInitiative.economic_impact_description,
      experienceImpact: apiInitiative.experience_impact,
      competitiveApproach: apiInitiative.competitive_approach,
      executiveSummary: apiInitiative.executive_summary,
      roi: apiInitiative.roi,
      // Map additional fields that might be needed
      product: apiInitiative.vertical, // Map vertical to product for compatibility
      summary: apiInitiative.description, // Map description to summary for compatibility
    };
  };

  const handleStatusChange = (initiativeId: string, newStatus: string) => {
    setInitiatives(prev => 
      prev.map(initiative => 
        initiative.id === initiativeId 
          ? { ...initiative, status: newStatus as any, updatedAt: new Date() }
          : initiative
      )
    );
  };

  const handleViewDetails = (initiativeId: string) => {
    const initiative = initiatives.find(i => i.id === initiativeId);
    if (initiative) {
      setSelectedInitiativeForEvaluation(initiative);
    }
  };

  const handleCloseEvaluation = () => {
    setSelectedInitiativeForEvaluation(null);
  };

  const handleEvaluationStatusChange = (newStatus: string, updatedFields?: any) => {
    if (selectedInitiativeForEvaluation) {
      setInitiatives(prev => 
        prev.map(initiative => 
          initiative.id === selectedInitiativeForEvaluation.id 
            ? { 
                ...initiative, 
                status: newStatus as any, 
                updatedAt: new Date(),
                // Update structured fields if provided
                ...(updatedFields && {
                  effortEstimate: updatedFields.effortEstimate,
                  confidence: updatedFields.confidence,
                  quarter: updatedFields.quarter
                })
              }
            : initiative
        )
      );
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const initiativeId = active.id as string;
    const newStatus = over.id as string;

    // Verificar que el estado sea válido
    const validStatuses = statusConfig.map(status => status.key);
    if (!validStatuses.includes(newStatus)) {
      console.log('Estado no válido:', newStatus);
      setActiveId(null);
      return;
    }

    // Obtener la iniciativa actual para verificar el cambio
    const currentInitiative = initiatives.find(i => i.id === initiativeId);
    if (!currentInitiative) {
      console.log('Iniciativa no encontrada:', initiativeId);
      setActiveId(null);
      return;
    }

    // Solo actualizar si el estado realmente cambió
    if (currentInitiative.status === newStatus) {
      console.log('Estado sin cambios:', newStatus);
      setActiveId(null);
      return;
    }

    console.log('Cambio de status:', {
      initiativeId,
      from: currentInitiative.status,
      to: newStatus,
      initiative: currentInitiative.title
    });

    try {
      // Update initiative status via API
      await apiService.moveInitiative(initiativeId, {
        new_status: newStatus,
        previous_status: currentInitiative.status,
        moved_by: 'user' // TODO: Get actual user ID
      });

      // Reload the specific initiative to get updated data including score
      try {
        const updatedInitiative = await apiService.getInitiative(initiativeId);
        const mappedInitiative = mapApiInitiativeToInitiative(updatedInitiative);
        
        // Update local state with the fresh data from backend
        setInitiatives(prev => 
          prev.map(initiative => 
            initiative.id === initiativeId 
              ? mappedInitiative
              : initiative
          )
        );
      } catch (reloadErr) {
        console.warn('Error reloading initiative, updating status only:', reloadErr);
        // Fallback: just update the status if reload fails
        setInitiatives(prev => 
          prev.map(initiative => 
            initiative.id === initiativeId 
              ? { ...initiative, status: newStatus as any, updatedAt: new Date() }
              : initiative
          )
        );
      }
    } catch (err) {
      console.error('Error updating initiative status:', err);
      setError(err instanceof Error ? err.message : 'Error updating initiative status');
    }

    setActiveId(null);
  };

  // Filter initiatives based on search query
  const filteredInitiatives = useMemo(() => {
    if (!searchQuery.trim()) return initiatives;
    
    const query = searchQuery.toLowerCase();
    return initiatives.filter(initiative => 
      initiative.title.toLowerCase().includes(query) ||
      initiative.description.toLowerCase().includes(query) ||
      initiative.product.toLowerCase().includes(query) ||
      initiative.country.toLowerCase().includes(query) ||
      initiative.category.toLowerCase().includes(query)
    );
  }, [initiatives, searchQuery]);

  const statusConfig = [
    {
      key: 'Backlog',
      title: 'Iniciativa Cargada',
      color: 'bg-yellow-50 border-yellow-200',
      headerColor: 'bg-yellow-100'
    },
    {
      key: 'Iniciativas cargadas a revisar',
      title: 'Revisión Negocio',
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'bg-blue-100'
    },
    {
      key: 'Iniciativas a estimar',
      title: 'Revisión Producto/Tech/UX',
      color: 'bg-purple-50 border-purple-200',
      headerColor: 'bg-purple-100'
    },
    {
      key: 'Priorizacion final',
      title: 'Cierre',
      color: 'bg-orange-50 border-orange-200',
      headerColor: 'bg-orange-100'
    },
    {
      key: 'Roadmap del Q',
      title: 'Priorizada',
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-green-100'
    }
  ];

  const getInitiativesByStatus = (status: string) => {
    return filteredInitiatives.filter(initiative => initiative.status === status);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando iniciativas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col bg-gray-50">
        {/* Board Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Tablero Kanban</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{filteredInitiatives.length} iniciativas</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Filtrado por: "{searchQuery}"
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter size={16} className="mr-2" />
                Filtros
              </button>
              <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full overflow-x-auto">
            {statusConfig.map((status) => {
              const statusInitiatives = getInitiativesByStatus(status.key);
              
              return (
                <DroppableColumn
                  key={status.key}
                  status={status.key}
                  title={status.title}
                  headerColor={status.headerColor}
                  initiativeCount={statusInitiatives.length}
                >
                  <SortableContext
                    items={statusInitiatives.map(initiative => initiative.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {statusInitiatives.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm py-8">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Plus size={20} className="text-gray-400" />
                        </div>
                        No hay iniciativas en esta etapa
                      </div>
                    ) : (
                      statusInitiatives.map((initiative) => (
                        <KanbanCard
                          key={initiative.id}
                          initiative={initiative}
                          onStatusChange={handleStatusChange}
                          onViewDetails={handleViewDetails}
                        />
                      ))
                    )}
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>
        </div>
        
        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <KanbanCard
              initiative={initiatives.find(i => i.id === activeId)!}
              onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails}
            />
          ) : null}
        </DragOverlay>
        
        {/* Evaluation Modal */}
        {selectedInitiativeForEvaluation && (
          <EvaluationView
            initiative={selectedInitiativeForEvaluation}
            onClose={handleCloseEvaluation}
            onStatusChange={handleEvaluationStatusChange}
          />
        )}
      </div>
    </DndContext>
  );
}