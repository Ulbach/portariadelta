import React from 'react'
import { AttendanceRecord } from '../types'
import { ICONS } from '../constants'

interface Props {
  activeCount: number
  records: AttendanceRecord[]
  loading: boolean
  onRefresh: () => void
  onNavigateAction: (type: 'NEW' | 'ACTIVE') => void
}

const Dashboard: React.FC<Props> = ({
  activeCount,
  records,
  loading,
  onRefresh,
  onNavigateAction
}) => {

  const recent = records.slice(0, 6)

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="bg-[#5b806d] text-white rounded-b-[40px] p-6 pb-16 relative">

        <div className="flex justify-between items-start">

          <div>

            <h1 className="text-xl font-bold">
              Portaria Inteligente
            </h1>

            <p className="text-xs tracking-widest opacity-80">
              CONTROLE DE PARCEIRO
            </p>

          </div>

          <button
            onClick={onRefresh}
            className="bg-white/20 rounded-full p-3"
          >
            <ICONS.Refresh className="w-5 h-5" />
          </button>

        </div>

      </div>

      {/* CARD PRESENTES */}

      <div className="bg-white rounded-2xl shadow-md p-4 -mt-12 flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div className="bg-slate-100 p-3 rounded-xl">
            <ICONS.Users className="w-6 h-6 text-[#5b806d]" />
          </div>

          <div>

            <div className="text-3xl font-bold">
              {activeCount}
            </div>

            <div className="text-xs text-slate-400 tracking-wider">
              PRESENTES AGORA
            </div>

          </div>

        </div>

        <button
          className="text-xs border px-4 py-2 rounded-full"
        >
          VER LISTA
        </button>

      </div>

      {/* AÇÕES */}

      <div className="grid grid-cols-2 gap-4">

        <button
          onClick={() => onNavigateAction('NEW')}
          className="bg-white p-4 rounded-2xl shadow flex items-center gap-3"
        >
          <div className="bg-slate-100 p-3 rounded-xl">
            <ICONS.Entry className="w-5 h-5 text-green-600" />
          </div>

          <span className="font-medium text-sm">
            Registrar Entrada
          </span>

        </button>

        <button
          onClick={() => onNavigateAction('ACTIVE')}
          className="bg-white p-4 rounded-2xl shadow flex items-center gap-3"
        >
          <div className="bg-red-100 p-3 rounded-xl">
            <ICONS.Exit className="w-5 h-5 text-red-600" />
          </div>

          <span className="font-medium text-sm">
            Registrar Saída
          </span>

        </button>

      </div>

      {/* ATIVIDADE RECENTE */}

      <div className="bg-white rounded-2xl shadow">

        <div className="flex justify-between items-center p-4 border-b">

          <h2 className="font-semibold">
            Atividade Recente
          </h2>

          <span className="text-xs text-slate-400">
            ÚLTIMOS 6
          </span>

        </div>

        <div>

          {loading && (
            <div className="p-6 text-center text-slate-400">
              Sincronizando...
            </div>
          )}

          {!loading && recent.map(r => (

            <div
              key={r.id}
              className="flex justify-between items-center p-4 border-b last:border-0"
            >

              <div className="flex items-center gap-3">

                <div className={`p-2 rounded-full ${
                  r.type === 'ENTRY'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>

                  {r.type === 'ENTRY'
                    ? <ICONS.Entry className="w-4 h-4 text-green-600"/>
                    : <ICONS.Exit className="w-4 h-4 text-red-600"/>}

                </div>

                <div>

                  <div className="font-semibold text-sm">
                    {r.partnerName}
                  </div>

                  <div className="text-xs text-slate-400">
                    {r.company}
                  </div>

                </div>

              </div>

              <div className="text-right text-xs">

                <div>
                  {r.timestamp.toLocaleDateString()}
                </div>

                <div className={`font-semibold ${
                  r.type === 'ENTRY'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>

                  {r.type === 'ENTRY'
                    ? 'ENTRADA'
                    : 'SAÍDA'}

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  )

}

export default Dashboard
