/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkshopProvider, useWorkshop } from './context/WorkshopContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { KanbanView } from './components/KanbanView';
import { CotizadorView } from './components/CotizadorView';
import { InventarioView } from './components/InventarioView';
import { CatalogoView } from './components/CatalogoView';
import { StoreFrontView } from './components/StoreFrontView';
import { FlotaView } from './components/FlotaView';
import { FinanzasView } from './components/FinanzasView';
import { FailureModal, ScaleCalibrationModal, LiquidationModal } from './components/Modals';
import { KanbanOrder, FilamentSpool } from './types';
import { CheckCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab } = useWorkshop();

  // Modals state
  const [failureModalOpen, setFailureModalOpen] = useState(false);
  const [selectedOrderForFailure, setSelectedOrderForFailure] = useState<KanbanOrder | null>(null);

  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [selectedSpoolForScale, setSelectedSpoolForScale] = useState<FilamentSpool | null>(null);

  const [liquidationModalOpen, setLiquidationModalOpen] = useState(false);
  const [selectedOrderForLiquidation, setSelectedOrderForLiquidation] = useState<KanbanOrder | null>(null);

  const handleOpenFailureModal = (order?: KanbanOrder) => {
    setSelectedOrderForFailure(order || null);
    setFailureModalOpen(true);
  };

  const handleOpenScaleModal = (spool: FilamentSpool) => {
    setSelectedSpoolForScale(spool);
    setScaleModalOpen(true);
  };

  const handleOpenLiquidationModal = (order: KanbanOrder) => {
    setSelectedOrderForLiquidation(order);
    setLiquidationModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1C1C18] flex flex-col justify-between selection:bg-[#EADDFB] selection:text-[#350463]">
      <Header />

      <main className="w-full pt-16 lg:pt-18 px-4 lg:px-8 pb-12 flex-1">
        {activeTab === 'dashboard' && (
          <DashboardView onOpenFailureModal={() => handleOpenFailureModal()} />
        )}
        {activeTab === 'taller' && (
          <KanbanView
            onOpenFailureModal={handleOpenFailureModal}
            onOpenLiquidationModal={handleOpenLiquidationModal}
          />
        )}
        {activeTab === 'cotizador' && <CotizadorView />}
        {activeTab === 'inventario' && (
          <InventarioView onOpenScaleModal={handleOpenScaleModal} />
        )}
        {activeTab === 'catalogo' && <CatalogoView />}
        {activeTab === 'flota' && <FlotaView />}
        {activeTab === 'tienda' && <StoreFrontView />}
        {activeTab === 'finanzas' && <FinanzasView />}
      </main>

      {/* FOOTER CON REDES SOCIALES EN LA PARTE INFERIOR (REQ 4) */}
      <footer className="w-full bg-[#F0EEE7] py-6 border-t border-[#E5E2DB]">
        <div className="w-full px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left max-w-[1720px] mx-auto text-xs text-[#4B4450]">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-extrabold text-[#350463] text-sm">KiMO 3D Studio</span>
            <span>© 2026 Laboratorio de Fabricación Aditiva, CDMX.</span>
          </div>

          {/* REDES SOCIALES: WHATSAPP, INSTAGRAM, FACEBOOK */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <a
              href="https://wa.me/525500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C0F441] hover:bg-[#aee02d] text-[#2E3F00] font-black text-xs transition-transform hover:scale-105 shadow-2xs"
            >
              <span>💬 WhatsApp</span>
            </a>
            <a
              href="https://instagram.com/kimo.ideas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EADDFB] hover:bg-[#d9c4f8] text-[#350463] font-extrabold text-xs transition-transform hover:scale-105 border border-[#6D3ACD]/20 shadow-2xs"
            >
              <span>📸 Instagram</span>
            </a>
            <a
              href="https://facebook.com/kimo3d"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF7F0] text-[#350463] border border-[#CDC3D2]/60 font-extrabold text-xs transition-transform hover:scale-105 shadow-2xs"
            >
              <span>🌐 Facebook</span>
            </a>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-[#2E3F00]">
              <CheckCircle className="w-3.5 h-3.5 text-[#86B100]" />
              Sistemas en línea
            </span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {failureModalOpen && (
        <FailureModal
          order={selectedOrderForFailure}
          onClose={() => {
            setFailureModalOpen(false);
            setSelectedOrderForFailure(null);
          }}
        />
      )}

      {scaleModalOpen && selectedSpoolForScale && (
        <ScaleCalibrationModal
          spool={selectedSpoolForScale}
          onClose={() => {
            setScaleModalOpen(false);
            setSelectedSpoolForScale(null);
          }}
        />
      )}

      {liquidationModalOpen && selectedOrderForLiquidation && (
        <LiquidationModal
          order={selectedOrderForLiquidation}
          onClose={() => {
            setLiquidationModalOpen(false);
            setSelectedOrderForLiquidation(null);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <WorkshopProvider>
      <MainContent />
    </WorkshopProvider>
  );
}
