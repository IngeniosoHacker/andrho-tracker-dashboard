import { useMemo, useState } from 'react'
import Stepper from '../ui/form/Stepper.jsx'
import Field from '../ui/form/Field.jsx'
import { TextInput, TextareaField, ChipMultiSelect, RadioCards, RatingScale } from '../ui/form/inputs.jsx'
import {
  SECTORS,
  COMPANY_SIZES,
  SALES_METHODS,
  MANAGEMENT_TOOLS,
  saveSubmission,
} from '../../lib/waitlist.js'

const STEPS = ['Contacto', 'Tu empresa', 'Presencia digital', 'Gestión actual']

const INITIAL_STATE = {
  name: '',
  company: '',
  email: '',
  sectors: [],
  companySize: '',
  salesMethod: '',
  hasWebsite: '',
  websiteUrl: '',
  restaurantExpiry: '',
  management: '',
  satisfaction: 0,
  satisfactionReason: '',
  improvement: '',
}

export default function MissionForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL_STATE)
  const [submitted, setSubmitted] = useState(false)

  const isRestaurant = form.sectors.includes('restaurantes')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return form.name.trim() && form.company.trim() && form.email.trim()
      case 1:
        return form.sectors.length > 0 && form.companySize && form.salesMethod
      case 2:
        return form.hasWebsite && (form.hasWebsite === 'no' || form.websiteUrl.trim())
      case 3:
        return form.management && form.satisfaction > 0
      default:
        return true
    }
  }, [step, form])

  function handleSubmit(e) {
    e.preventDefault()
    saveSubmission(form)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <section id="mission-form" className="mx-auto max-w-2xl px-6 py-28 text-center lg:px-10">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Asiento reservado, {form.name.split(' ')[0]}.</h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--c-mist)]">
          Gracias por sumarte a la tripulación de <strong className="text-[var(--c-stardust)]">{form.company}</strong>.
          Te escribiremos a <strong className="text-[var(--c-stardust)]">{form.email}</strong> apenas abramos las
          primeras cuentas.
        </p>
        <p className="mt-4 text-[var(--c-mist)]">
          {form.hasWebsite === 'no'
            ? 'Como todavía no tienes página web, te compartiremos el script de tracking de AndRho para que empieces a capturar datos desde el día uno.'
            : 'Como ya tienes página web, te enviaremos las instrucciones para instalar el plugin de AndRho en tu sitio.'}
        </p>
        <a
          href="#top"
          className="mt-9 inline-block rounded-full border border-[var(--c-line)] px-6 py-3 font-medium transition-colors hover:border-[var(--c-comet)]/50 hover:text-[var(--c-comet)]"
        >
          Volver al inicio ↑
        </a>
      </section>
    )
  }

  return (
    <section id="mission-form" className="border-t border-[var(--c-line)] bg-[var(--c-nebula)] py-28 lg:py-40">
      <div className="mx-auto max-w-2xl px-6 lg:px-10">
        <div className="mb-12 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Cuéntanos de tu negocio</h2>
          <p className="mt-4 text-lg text-[var(--c-mist)]">
            No hay respuestas incorrectas. Esto nos ayuda a construir lo que de verdad necesitas.
          </p>
        </div>

        <Stepper steps={STEPS} current={step} />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (step < STEPS.length - 1) {
              setStep((s) => s + 1)
            } else {
              handleSubmit(e)
            }
          }}
          className="glass-panel space-y-6 rounded-3xl p-6 shadow-2xl shadow-black/30 sm:p-10"
        >
          {step === 0 && (
            <>
              <Field label="Tu nombre" required>
                <TextInput
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Ada Lovelace"
                />
              </Field>
              <Field label="Nombre de tu empresa" required>
                <TextInput
                  required
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  placeholder="Nova Textiles"
                />
              </Field>
              <Field label="Correo" required hint="Solo lo usaremos para avisarte cuando AndRho esté listo.">
                <TextInput
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="tucorreo@empresa.com"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="¿De qué es tu empresa?" required hint="Selección múltiple.">
                <ChipMultiSelect options={SECTORS} value={form.sectors} onChange={(v) => update('sectors', v)} />
              </Field>
              <Field label="Tamaño de tu empresa" required>
                <RadioCards options={COMPANY_SIZES} value={form.companySize} onChange={(v) => update('companySize', v)} />
              </Field>
              <Field label="Metodología de venta" required>
                <RadioCards options={SALES_METHODS} value={form.salesMethod} onChange={(v) => update('salesMethod', v)} />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="¿Tienes página web?" required>
                <RadioCards
                  options={[
                    { value: 'si', label: 'Sí, ya tengo' },
                    { value: 'no', label: 'No, todavía no' },
                  ]}
                  value={form.hasWebsite}
                  onChange={(v) => update('hasWebsite', v)}
                />
              </Field>

              {form.hasWebsite === 'si' && (
                <Field label="¿Cuál es tu sitio?" required hint="Te enviaremos instrucciones para instalar el plugin de AndRho ahí.">
                  <TextInput
                    type="url"
                    required
                    value={form.websiteUrl}
                    onChange={(e) => update('websiteUrl', e.target.value)}
                    placeholder="https://tuempresa.com"
                  />
                </Field>
              )}
              {form.hasWebsite === 'no' && (
                <p className="rounded-lg border border-[var(--c-line)] bg-[var(--c-nebula)] px-4 py-3 text-sm text-[var(--c-mist)]">
                  Sin problema — te compartiremos el script del AndRho Web-tracker para que empieces a
                  capturar datos apenas tengas un sitio.
                </p>
              )}

              {isRestaurant && (
                <Field label="¿Organizas tus productos por fecha de vencimiento?" hint="Pregunta específica para restaurantes.">
                  <RadioCards
                    options={[
                      { value: 'si', label: 'Sí' },
                      { value: 'no', label: 'No' },
                    ]}
                    value={form.restaurantExpiry}
                    onChange={(v) => update('restaurantExpiry', v)}
                  />
                </Field>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Field label="¿Usas software o papel para administrar?" required>
                <RadioCards options={MANAGEMENT_TOOLS} value={form.management} onChange={(v) => update('management', v)} columns={1} />
              </Field>
              <Field label="¿Qué tan satisfecho estás con tu software/proceso actual?" required hint="1 = nada satisfecho · 5 = muy satisfecho">
                <RatingScale value={form.satisfaction} onChange={(v) => update('satisfaction', v)} />
              </Field>
              <Field label="¿Por qué?">
                <TextareaField
                  value={form.satisfactionReason}
                  onChange={(e) => update('satisfactionReason', e.target.value)}
                  placeholder="Cuéntanos qué funciona o qué no..."
                />
              </Field>
              <Field label="¿Qué te gustaría mejorar?">
                <TextareaField
                  value={form.improvement}
                  onChange={(e) => update('improvement', e.target.value)}
                  placeholder="Si pudieras arreglar una sola cosa, ¿cuál sería?"
                />
              </Field>
            </>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`font-mono text-xs uppercase tracking-widest text-[var(--c-mist)] transition-colors hover:text-[var(--c-stardust)] ${step === 0 ? 'invisible' : ''}`}
            >
              ← Atrás
            </button>
            <button
              type="submit"
              disabled={!canAdvance}
              className="btn-solar rounded-full px-6 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step < STEPS.length - 1 ? 'Siguiente →' : 'Completar misión'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
