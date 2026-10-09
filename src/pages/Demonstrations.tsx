import React, { useState } from 'react';
import { Plus, Video, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Modal, Select, Badge, Card, Tabs, EmptyState, LoadingSpinner, Textarea } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import { useDemonstrations, useDemonstrationMutations } from '@/hooks/useDemonstrations';
import { Demonstration } from '@/types';

export default function Demonstrations() {
  const { data: demos, isLoading, error } = useDemonstrations();
  const { createDemonstration, updateDemonstration } = useDemonstrationMutations();
  const [activeTab, setActiveTab] = useState('scheduled');
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return <div className="flex h-full items-center justify-center p-8"><LoadingSpinner /></div>;
  if (error) return <div className="p-8"><EmptyState title="Erro" description="Falha ao carregar demonstrações." icon={AlertCircle} /></div>;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Demonstrações</h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Demonstração</Button>
      </div>

      <Tabs 
        tabs={[
          {id: 'scheduled', label: 'Agendadas'},
          {id: 'completed', label: 'Realizadas'},
          {id: 'cancelled', label: 'Canceladas'},
          {id: 'all', label: 'Todas'}
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demos?.map((demo: Demonstration) => (
          <Card key={demo.id} className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <Badge variant={demo.status === 'scheduled' ? 'default' : demo.status === 'completed' ? 'success' : 'danger'}>
                {demo.status}
              </Badge>
              <span className="text-xs font-medium text-dark-400 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {demo.duration_minutes} min
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-dark-100">{demo.lead_id}</h3>
              <p className="text-sm text-dark-300 flex items-center mt-1">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(demo.scheduled_at)}
              </p>
            </div>
            {demo.meeting_link && (
              <a href={demo.meeting_link} target="_blank" rel="noreferrer" className="text-sm text-cortex-500 hover:underline flex items-center">
                <Video className="w-4 h-4 mr-1" /> Entrar na Reunião
              </a>
            )}
            {demo.status === 'scheduled' && (
              <div className="mt-auto pt-4 border-t border-dark-700 flex gap-2">
                <Button variant="primary" className="flex-1 text-xs"><CheckCircle className="w-3 h-3 mr-1" /> Realizada</Button>
                <Button variant="secondary" className="text-xs"><XCircle className="w-3 h-3 mr-1" /> Cancelar</Button>
              </div>
            )}
          </Card>
        ))}
        {demos?.length === 0 && <div className="col-span-full py-12"><EmptyState title="Nenhuma demonstração" description="Agende novas demonstrações com seus leads." /></div>}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Agendar Demonstração">
        <form className="space-y-4 p-4" onSubmit={e => { e.preventDefault(); setModalOpen(false); }}>
          <Input label="Lead" required placeholder="Buscar lead..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data/Hora" type="datetime-local" required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-dark-300">Duração</label>
              <select className="input-base">
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1h 30m</option>
                <option value="120">2 horas</option>
              </select>
            </div>
          </div>
          <Input label="Link da Reunião (opcional)" type="url" />
          <Textarea label="Notas adicionais" />
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Agendar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
