import React, { useEffect, useMemo, useState } from "react";
import { AllVariantsCheck, CardDiagnosis, DiagnosedLayer, DiagnosedProperty, TestCardResult } from "../../shared/types";
import { VariantCheckPanel } from "./VariantCheckPanel";
import { NamingTester } from "./NamingTester";
import { TitleBar } from "../components/TitleBar";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { buildDiagnosticReport, copyText } from "../diagnosticReport";
import { GA_CARD_SET_NAME } from "../../shared/gaCard";

/**
 * Fase 2 — tela de diagnóstico do card "[Helper] Google Analytics Spec".
 * Ferramenta temporária de desenvolvimento: lê uma instância real do card
 * e mostra/copia tudo o que a geração vai precisar. Também cria um card de
 * teste para validar a importação pela chave.
 */

interface CardDiagnosticProps {
  diagnosis: CardDiagnosis | null;
  diagnosisError: string | null;
  reading: boolean;
  testCard: TestCardResult | null;
  creatingTestCard: boolean;
  allVariants: AllVariantsCheck | null;
  checkingAllVariants: boolean;
  onCheckAllVariants: () => void;
  onRead: () => void;
  onCreateTestCard: (variantValues: Record<string, string>) => void;
  onBack: () => void;
  onClose: () => void;
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  color: "var(--color-text-subtle)",
  margin: "22px 0 8px"
};

const box: React.CSSProperties = {
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface)",
  padding: "10px 12px"
};

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 11.5, wordBreak: "break-all" };

function KeyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "3px 0", alignItems: "baseline" }}>
      <span style={{ minWidth: 92, fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ ...mono, color: "var(--color-text-dark)" }}>{value}</span>
    </div>
  );
}

function PropertyRow({ property }: { property: DiagnosedProperty }) {
  const value =
    typeof property.value === "boolean" ? (property.value ? "ligado" : "desligado") : String(property.value);
  return (
    <div style={{ padding: "8px 0", borderTop: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 800 }}>{property.displayName}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: ".05em",
            color: "var(--color-primary-ink)",
            background: "var(--color-primary-tint)",
            borderRadius: 999,
            padding: "2px 7px"
          }}
        >
          {property.type}
        </span>
      </div>
      <div style={{ ...mono, color: "var(--color-text-muted)", marginTop: 2 }}>{property.name}</div>
      <div style={{ fontSize: 12, marginTop: 3 }}>
        Valor atual: <strong>{value}</strong>
      </div>
      {property.options && (
        <div style={{ fontSize: 12, marginTop: 3, color: "var(--color-text-muted)" }}>
          {property.options.length} opções: {property.options.join(" · ")}
        </div>
      )}
    </div>
  );
}

function LayerRow({ layer }: { layer: DiagnosedLayer }) {
  return (
    <div
      style={{
        paddingLeft: layer.depth * 12,
        padding: `3px 0 3px ${layer.depth * 12}px`,
        fontSize: 12,
        color: layer.visible ? "var(--color-text-dark)" : "var(--color-text-disabled)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {!layer.visible && <Icon name="eye-off" size={11} color="var(--color-text-disabled)" />}
        <span style={{ ...mono, fontSize: 10.5, color: "var(--color-text-subtle)" }}>{layer.type}</span>
        <span style={{ fontWeight: 700 }}>{layer.name}</span>
      </div>
      {layer.characters !== undefined && (
        <div style={{ ...mono, fontSize: 11, marginLeft: 16, color: "var(--color-text-muted)" }}>"{layer.characters}"</div>
      )}
      {layer.propertyRefs && (
        <div style={{ ...mono, fontSize: 10.5, marginLeft: 16, color: "var(--color-primary-ink)" }}>
          {Object.entries(layer.propertyRefs)
            .map(([field, property]) => `${field} ← ${property}`)
            .join(" · ")}
        </div>
      )}
    </div>
  );
}

export function CardDiagnostic({
  diagnosis,
  diagnosisError,
  reading,
  testCard,
  creatingTestCard,
  allVariants,
  checkingAllVariants,
  onCheckAllVariants,
  onRead,
  onCreateTestCard,
  onBack,
  onClose
}: CardDiagnosticProps) {
  const variantProperties = useMemo(
    () => (diagnosis ? diagnosis.properties.filter((property) => property.type === "VARIANT") : []),
    [diagnosis]
  );
  const [variantValues, setVariantValues] = useState<Record<string, string>>({});
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Ao ler um card novo, o formulário do card de teste começa com os valores atuais dele.
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const property of variantProperties) initial[property.name] = String(property.value);
    setVariantValues(initial);
    setCopyFeedback(null);
  }, [variantProperties]);

  const report = diagnosis ? buildDiagnosticReport(diagnosis, testCard) : "";

  function handleCopy() {
    setCopyFeedback(copyText(report) ? "Relatório copiado." : "Não deu para copiar — selecione o texto abaixo e use Ctrl+C.");
  }

  const canCreateTestCard = !!diagnosis && diagnosis.nodeType === "INSTANCE" && !!diagnosis.mainComponent;

  return (
    <>
      <TitleBar title="Ferramentas de desenvolvimento" showBack onBack={onBack} onClose={onClose} />
      <div className="scroll-area" style={{ padding: "4px 20px 24px" }}>
        <h3 style={sectionTitle}>Testar nomenclatura</h3>
        <NamingTester />

        <h3 style={sectionTitle}>Verificação completa do card</h3>
        <VariantCheckPanel result={allVariants} checking={checkingAllVariants} onCheck={onCheckAllVariants} />

        <h3 style={sectionTitle}>Card selecionado</h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--color-text-muted)" }}>
          Selecione no canvas uma instância do card{" "}
          <strong style={{ color: "var(--color-text-dark)" }}>{GA_CARD_SET_NAME}</strong> e clique em Ler card
          selecionado. O plugin só lê: o card não é alterado.
        </p>

        <div style={{ marginTop: 12 }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={onRead}
            disabled={reading}
            icon={<Icon name={diagnosis ? "refresh" : "search"} size={15} />}
          >
            {reading ? "Lendo…" : diagnosis ? "Ler de novo" : "Ler card selecionado"}
          </Button>
        </div>

        {diagnosisError && (
          <div
            role="alert"
            style={{
              ...box,
              marginTop: 12,
              background: "var(--color-danger-bg)",
              borderColor: "var(--color-danger-border)",
              color: "var(--color-danger)",
              fontSize: 12.5,
              fontWeight: 700,
              display: "flex",
              gap: 8
            }}
          >
            <Icon name="alert-circle" size={14} color="var(--color-danger)" />
            <span>{diagnosisError}</span>
          </div>
        )}

        {diagnosis && (
          <>
            {diagnosis.warnings.length > 0 && (
              <div
                style={{
                  ...box,
                  marginTop: 12,
                  background: "var(--color-warning-bg)",
                  borderColor: "var(--color-warning-border)",
                  color: "var(--color-warning)",
                  fontSize: 12.5,
                  fontWeight: 700
                }}
              >
                {diagnosis.warnings.map((warning, index) => (
                  <div key={index} style={{ display: "flex", gap: 8, marginTop: index > 0 ? 6 : 0 }}>
                    <Icon name="alert-triangle" size={14} color="var(--color-warning)" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <Button variant="secondary" fullWidth onClick={handleCopy} icon={<Icon name="copy" size={15} />}>
                Copiar relatório completo
              </Button>
              {copyFeedback && (
                <div role="status" style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textAlign: "center" }}>
                  {copyFeedback}
                </div>
              )}
            </div>

            <h3 style={sectionTitle}>Componente</h3>
            <div style={box}>
              <KeyRow label="Camada" value={`${diagnosis.nodeName} (${diagnosis.nodeType})`} />
              {diagnosis.componentSet && (
                <>
                  <KeyRow label="Conjunto" value={diagnosis.componentSet.name} />
                  <KeyRow label="Chave conj." value={diagnosis.componentSet.key} />
                </>
              )}
              {diagnosis.mainComponent && (
                <>
                  <KeyRow label="Variante" value={diagnosis.mainComponent.name} />
                  <KeyRow label="Chave var." value={diagnosis.mainComponent.key} />
                  <KeyRow label="Biblioteca" value={diagnosis.mainComponent.remote ? "publicada" : "componente local"} />
                </>
              )}
            </div>

            <h3 style={sectionTitle}>Propriedades ({diagnosis.properties.length})</h3>
            <div style={{ ...box, paddingTop: 2, paddingBottom: 2 }}>
              {diagnosis.properties.length === 0 ? (
                <div style={{ fontSize: 12.5, padding: "8px 0", color: "var(--color-text-muted)" }}>Nenhuma propriedade.</div>
              ) : (
                diagnosis.properties.map((property, index) => (
                  <div key={property.name} style={index === 0 ? { marginTop: -1 } : undefined}>
                    <PropertyRow property={property} />
                  </div>
                ))
              )}
            </div>

            <h3 style={sectionTitle}>
              Camadas ({diagnosis.layers.length}
              {diagnosis.layersTruncated ? ", cortada" : ""})
            </h3>
            <div style={box}>
              {diagnosis.layers.map((layer, index) => (
                <LayerRow key={index} layer={layer} />
              ))}
            </div>

            <h3 style={sectionTitle}>Fontes</h3>
            <div style={{ ...box, fontSize: 12.5 }}>
              {diagnosis.fonts.length > 0 ? diagnosis.fonts.join(", ") : "Nenhuma camada de texto."}
            </div>

            <h3 style={sectionTitle}>Card de teste</h3>
            <div style={box}>
              {canCreateTestCard ? (
                <>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: "var(--color-text-muted)" }}>
                    Cria uma instância nova ao lado do card lido, importando pela chave, com as variantes escolhidas.
                    Toggles e textos ficam no padrão do componente.
                  </p>
                  {variantProperties.map((property) => (
                    <label key={property.name} style={{ display: "block", marginTop: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{property.displayName}</span>
                      <select
                        value={variantValues[property.name] ?? String(property.value)}
                        onChange={(event) =>
                          setVariantValues((previous) => ({ ...previous, [property.name]: event.target.value }))
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          marginTop: 4,
                          height: 36,
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border-strong)",
                          padding: "0 8px",
                          fontSize: 13,
                          background: "var(--color-surface)"
                        }}
                      >
                        {(property.options ?? [String(property.value)]).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <div style={{ marginTop: 12 }}>
                    <Button
                      variant="secondary"
                      fullWidth
                      disabled={creatingTestCard}
                      onClick={() => onCreateTestCard(variantValues)}
                      icon={<Icon name="plus" size={15} />}
                    >
                      {creatingTestCard ? "Criando…" : "Criar card de teste"}
                    </Button>
                  </div>
                  {testCard && (
                    <div
                      role="status"
                      style={{
                        marginTop: 10,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: testCard.ok ? "var(--color-primary-ink)" : "var(--color-danger)"
                      }}
                    >
                      <div style={{ display: "flex", gap: 6 }}>
                        <Icon
                          name={testCard.ok ? "check" : "alert-circle"}
                          size={14}
                          color={testCard.ok ? "var(--color-primary)" : "var(--color-danger)"}
                        />
                        <span>{testCard.message}</span>
                      </div>
                      {testCard.method && (
                        <div style={{ fontWeight: 600, color: "var(--color-text-muted)", marginTop: 4 }}>{testCard.method}</div>
                      )}
                      {testCard.importError && (
                        <div style={{ ...mono, fontWeight: 400, color: "var(--color-warning)", marginTop: 4 }}>
                          Erro da importação: {testCard.importError}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-text-muted)" }}>
                  Disponível quando a seleção for uma instância com componente principal.
                </p>
              )}
            </div>

            <h3 style={sectionTitle}>Relatório (texto)</h3>
            <textarea
              readOnly
              value={report}
              aria-label="Relatório do diagnóstico"
              onFocus={(event) => event.currentTarget.select()}
              style={{
                width: "100%",
                height: 180,
                ...mono,
                fontSize: 11,
                padding: 10,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-strong)",
                resize: "vertical",
                background: "var(--color-surface-subtle)"
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
