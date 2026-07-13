// Control UI view renders agents panels overview screen content.
import { html, nothing } from "lit";
import type {
  AgentIdentityResult,
  AgentsFilesListResult,
  AgentsListResult,
  ModelCatalogEntry,
} from "../../api/types.ts";
import { renderSettingsRow, renderSettingsSection } from "../../components/settings-ui.ts";
import "../../components/tooltip.ts";
import { t } from "../../i18n/index.ts";
import {
  buildModelOptions,
  normalizeModelValue,
  parseFallbackList,
  resolveAgentConfig,
  resolveAgentRuntimeLabel,
  resolveModelFallbacks,
  resolveModelLabel,
  resolveModelPrimary,
} from "../../lib/agents/display.ts";
import type { AgentsPanel } from "../../lib/agents/index.ts";

export function renderAgentOverview(params: {
  agent: AgentsListResult["agents"][number];
  basePath: string;
  defaultId: string | null;
  configForm: Record<string, unknown> | null;
  agentFilesList: AgentsFilesListResult | null;
  agentIdentity: AgentIdentityResult | null;
  agentIdentityLoading: boolean;
  agentIdentityError: string | null;
  configLoading: boolean;
  configSaving: boolean;
  configDirty: boolean;
  modelCatalog: ModelCatalogEntry[];
  onConfigReload: () => void;
  onConfigSave: () => void;
  onModelChange: (agentId: string, modelId: string | null) => void;
  onModelFallbacksChange: (agentId: string, fallbacks: string[]) => void;
  onSelectPanel: (panel: AgentsPanel) => void;
}) {
  const {
    agent,
    configForm,
    agentFilesList,
    configLoading,
    configSaving,
    configDirty,
    onConfigReload,
    onConfigSave,
    onModelChange,
    onModelFallbacksChange,
    onSelectPanel,
  } = params;
  const isDefault = Boolean(params.defaultId && agent.id === params.defaultId);
  const config = resolveAgentConfig(configForm, agent.id);
  const agentModel = agent.model;
  const workspaceFromFiles =
    agentFilesList && agentFilesList.agentId === agent.id ? agentFilesList.workspace : null;
  const workspace =
    workspaceFromFiles ||
    config.entry?.workspace ||
    config.defaults?.workspace ||
    agent.workspace ||
    "default";
  const model = config.entry?.model
    ? resolveModelLabel(config.entry?.model)
    : config.defaults?.model
      ? resolveModelLabel(config.defaults?.model)
      : resolveModelLabel(agentModel);
  const runtime = resolveAgentRuntimeLabel(agent.agentRuntime);
  const defaultModel = resolveModelLabel(config.defaults?.model ?? agentModel);
  const entryPrimary = resolveModelPrimary(config.entry?.model);
  const defaultPrimary =
    resolveModelPrimary(config.defaults?.model) ||
    (defaultModel !== "-" ? normalizeModelValue(defaultModel) : null) ||
    (configForm ? null : resolveModelPrimary(agentModel));
  const effectivePrimary = entryPrimary ?? defaultPrimary ?? null;
  const selectedPrimary = isDefault ? effectivePrimary : entryPrimary;
  const modelFallbacks =
    resolveModelFallbacks(config.entry?.model) ??
    resolveModelFallbacks(config.defaults?.model) ??
    (configForm ? null : resolveModelFallbacks(agentModel));
  const fallbackChips = modelFallbacks ?? [];
  const skillFilter = Array.isArray(config.entry?.skills) ? config.entry?.skills : null;
  const skillCount = skillFilter?.length ?? null;
  const disabled = !configForm || configLoading || configSaving;
  const thinkingDefault = agent.thinkingDefault ?? "-";

  const removeChip = (index: number) => {
    const next = fallbackChips.filter((_, i) => i !== index);
    onModelFallbacksChange(agent.id, next);
  };

  const handleChipKeydown = (e: KeyboardEvent) => {
    const input = e.target as HTMLInputElement;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const parsed = parseFallbackList(input.value);
      if (parsed.length > 0) {
        onModelFallbacksChange(agent.id, [...fallbackChips, ...parsed]);
        input.value = "";
      }
    }
  };

  return html`
    ${renderSettingsSection(
      { title: t("agents.overview.title"), description: t("agents.overview.subtitle") },
      html`
        <dl class="settings-kv">
          <dt>${t("agents.context.workspace")}</dt>
          <dd>
            <openclaw-tooltip .content=${t("agents.context.openFilesTab")}>
              <button
                type="button"
                class="workspace-link mono"
                @click=${() => onSelectPanel("files")}
                aria-label=${t("agents.context.openFilesTab")}
              >
                ${workspace}
              </button>
            </openclaw-tooltip>
          </dd>
          <dt>${t("agents.context.primaryModel")}</dt>
          <dd><code>${model}</code></dd>
          <dt>${t("agents.context.runtime")}</dt>
          <dd><code>${runtime}</code></dd>
          <dt>${t("agents.context.thinkingDefault")}</dt>
          <dd><code>${thinkingDefault}</code></dd>
          <dt>${t("agents.context.skillsFilter")}</dt>
          <dd>
            ${skillFilter
              ? t("agents.overview.selectedSkills", { count: String(skillCount) })
              : t("agents.overview.allSkills")}
          </dd>
        </dl>
      `,
    )}
    ${configDirty
      ? html`<div class="callout warn">${t("agents.overview.unsavedConfig")}</div>`
      : nothing}
    ${renderSettingsSection(
      {
        title: t("agents.overview.modelSelection"),
        actions: html`
          <button
            type="button"
            class="btn btn--sm"
            ?disabled=${configLoading}
            @click=${onConfigReload}
          >
            ${t("common.reloadConfig")}
          </button>
          <button
            type="button"
            class="btn btn--sm primary"
            ?disabled=${configSaving || !configDirty}
            @click=${onConfigSave}
          >
            ${configSaving ? t("common.saving") : t("common.save")}
          </button>
        `,
      },
      html`
        ${renderSettingsRow({
          title: isDefault
            ? t("agents.overview.primaryModelDefault")
            : t("agents.overview.primaryModel"),
          control: html`
            <select
              class="settings-select"
              .value=${selectedPrimary ?? ""}
              ?disabled=${disabled}
              @change=${(e: Event) =>
                onModelChange(agent.id, (e.target as HTMLSelectElement).value || null)}
            >
              ${isDefault
                ? html`
                    <option value="" ?selected=${!selectedPrimary}>
                      ${t("agents.overview.notSet")}
                    </option>
                  `
                : html`
                    <option value="" ?selected=${!selectedPrimary}>
                      ${defaultPrimary
                        ? t("agents.overview.inheritDefaultModel", { model: defaultPrimary })
                        : t("agents.overview.inheritDefault")}
                    </option>
                  `}
              ${buildModelOptions(
                configForm,
                effectivePrimary ?? undefined,
                params.modelCatalog,
                selectedPrimary,
              )}
            </select>
          `,
        })}
        ${renderSettingsRow({
          title: t("agents.overview.fallbacks"),
          stacked: true,
          control: html`
            <div
              class="agent-chip-input"
              @click=${(e: Event) => {
                const container = e.currentTarget as HTMLElement;
                const input = container.querySelector("input");
                if (input) {
                  input.focus();
                }
              }}
            >
              ${fallbackChips.map(
                (chip, i) => html`
                  <span class="chip">
                    ${chip}
                    <button
                      type="button"
                      class="chip-remove"
                      ?disabled=${disabled}
                      @click=${() => removeChip(i)}
                    >
                      &times;
                    </button>
                  </span>
                `,
              )}
              <input
                ?disabled=${disabled}
                placeholder=${fallbackChips.length === 0 ? "provider/model" : ""}
                @keydown=${handleChipKeydown}
                @blur=${(e: Event) => {
                  const input = e.target as HTMLInputElement;
                  const parsed = parseFallbackList(input.value);
                  if (parsed.length > 0) {
                    onModelFallbacksChange(agent.id, [...fallbackChips, ...parsed]);
                    input.value = "";
                  }
                }}
              />
            </div>
          `,
        })}
      `,
    )}
  `;
}
