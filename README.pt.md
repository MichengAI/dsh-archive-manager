<p align="center">
  <img src="assets/branding/dsh-banner-en.webp" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **Gerenciamento seguro de sessões arquivadas no DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Histórico de alterações](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Licença: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![Pacote npm](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![Downloads npm](https://img.shields.io/npm/dt/%40michengai%2Fdsh-archive-manager.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![Compatível com DSH até 0.2.2-rc.1](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.1-2563eb.svg)](#requisitos-prévios)
</div>

> DSH Archive Manager é um plugin mantido pela comunidade para o DeepSeek Harness (DSH), não sendo um produto oficial da DeepSeek AI.

Este documento refere-se à versão **1.3.0**. Consulte o [registro de alterações](CHANGELOG.md) para detalhes.

## Visão geral

Guarde conversas inativas de forma segura e recupere-as quando precisar, mantendo suas listas diárias de tarefas organizadas.

- **Visualização dupla e acesso direto na barra lateral**: Um ícone dedicado na barra lateral principal abre um painel centralizado de **960 px** para sessões arquivadas e não arquivadas, eliminando limitações de rolagem em janelas estreitas.
- **Gerenciamento completo do ciclo de vida**: Arquive conversas individuais, espaços de trabalho inteiros com um clique, lotes entre projetos, e restaure ou retome sessões diretamente.
- **Clique com o botão direito em toda a linha da barra lateral**: Clique com o botão direito em qualquer área de uma linha de espaço de trabalho ou sessão para abrir o menu de ações. Linhas não agrupadas ou em branco mantêm o menu nativo do sistema.
- **Estrela de favoritos estável e convivência com pontos de status (#90, #92)**: Estrela padronizada em 16×16 px com sobreposição absoluta no slot inicial para eliminar deslocamentos no título. Durante tarefas em execução ou aguardando aprovação, o ponto de status do host permanece 100% visível enquanto a estrela se adapta em um emblema compacto de 10 px no canto inferior direito.
- **Menu de ações rápidas do espaço de trabalho**: Copie o caminho da pasta, abra a pasta diretamente no Explorador de Arquivos do Windows ou Finder do macOS e arquive sessões com um clique.
- **Mover sessões entre espaços de trabalho**: Transfira conversas entre espaços de trabalho por meio de um submenu dinâmico ao passar o mouse, com congelamento seguro de processos, reescrita atômica e proteção para caracteres especiais em sistemas NTFS.
- **Cartões de acordeão unificados e linhas ultracompactas de 40 px**: Grupos organizados em gavetas integradas estilo Skills Manager (cabeçalho de 38 px) e linhas de 40 px para duplicar a densidade de informações.
- **Caixas de seleção nativas em modo escuro**: Componentes que seguem estritamente as especificações do host com `accent-color` nativo, integrando-se perfeitamente com temas escuros e estados ativos.
- **Janelas modais opacas sem transparências e acessibilidade localizada**: Montagem direta no `body` (`portalToBody`) com fundo sólido e desfoque para evitar sobreposição de textos. Rótulos de acessibilidade completos para o botão de fechar (`common.close`).
- **ID de seção padronizado e coexistência (#91)**: ID registrado como `archive-manager` com proteção em tempo de execução (`try/catch`), garantindo convivência pacífica com plugins de terceiros.
- **Barra de ferramentas adaptativa em linha única**: Usa o componente nativo `Input` com ícone de pesquisa oficial e contorno verde ao focar. Reúne busca, menu de exibição e ordenação, filtro de projetos e seletor de datas em uma única linha.
- **Busca em texto completo e menu estilo Codex**: Busca que cobre títulos e histórico de mensagens (usuário e assistente). Menu com duas seções para alternar entre todas ou apenas favoritas e ordenar resultados.
- **Seletor DateRange com popover leve de calendário**: Substitui o elemento nativo de data para eliminar inversão de cores e perda de foco no modo escuro (#74). Exibe o intervalo em uma linha com botão de limpeza, predefinições rápidas, 8 idiomas para dias e meses e navegação por teclado WAI-ARIA.
- **Limpeza automática de sessões inativas**: Defina um limite de dias para detectar conversas ociosas, protegendo automaticamente tarefas em execução, perguntas interativas e favoritos, com opção de desfazer imediata (Undo).
- **Exclusão física definitiva**: Eliminação física completa de registros, linhas de cache e índices, com relatório detalhado de erros e nova tentativa por item.
- **Detecção e limpeza de subagentes órfãos**: Identificação de subagentes cujas sessões principais foram excluídas externamente, exibindo o espaço ocupado no disco e permitindo a liberação física em um clique.
- **Bloqueio corporativo via configuração Cordis e suporte a proxy reverso**: Suporte a bloqueio completo nas configurações do Cordis (`updater: false` ou `onlineUpdate: false`) e resolução dinâmica de endpoints via `document.baseURI`.

## Reconstrução manual de cache de lista (#88)

Ao abrir o Archive Manager, verificam-se apenas os cabeçalhos e as projeções em cache oficiais para sessões normais nos espaços de trabalho registrados, listas não agrupadas e arquivos (excluindo sessões de canais de mensagens instantâneas `im:`). Se houver cache ausente ou incompatível, um cartão de reparo é exibido para ler os registros um a um em modo somente leitura e reconstruir as projeções com o `coldSnapshot` oficial em `session_projcache`.

## Limpeza de subagentes órfãos

Se uma sessão principal for removida externamente, subagentes podem permanecer no disco. O Archive Manager os identifica no painel do Organizador e permite a exclusão física segura.

## Busca e pré-visualização

- As abas «Arquivadas» e «Não arquivadas» compartilham a busca por título e conteúdo, filtro de projetos, favoritos, filtro de datas e ordenação por data de criação.
- A pré-visualização renderiza tabelas Markdown, citações e blocos de código com identificação de remetente, ou permite ver o texto original destacado.
- A busca processa lotes de até 20 sessões consecutivas com consulta de até 200 caracteres, excluindo ferramentas, anexos, raciocínios e mensagens do sistema.

## Instalação

Requer um ambiente funcional do DeepSeek Harness (exemplo com o perfil `web`):

### Instalação assistida por agente
Envie este comando para um assistente com acesso ao terminal da sua máquina:

```text
Instale a versão mais recente do @michengai/dsh-archive-manager no meu perfil web do DSH usando o registro oficial do npm, verifique a ativação e explique como recarregar.
```

### Instalação manual

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

Reinicie o DSH Web e atualize a página no navegador (`Ctrl+Shift+R`). Abra **Configurações → Sessões arquivadas** para começar.

- **Compatibilidade com o host**: Linha DeepSeek Harness `0.2.x` completa (`>=0.2.0-rc.1 <0.3.0-0`), verificada em todas as versões candidatas (`0.2.0-rc.1` a `0.2.2-rc.1`).
- Versões anteriores a `0.2.0-rc.1` não são mais suportadas. Para ambientes `0.1.x`, instale a versão `1.0.20`.

## Configuração do plugin

Disponível em:
> **Barra lateral → Plugins → Clique em `Archive Manager`**

### 1. Localização do atalho (`entryLocation`)
- **Ambos os locais (`both`)**: Mostra o ícone na barra lateral esquerda e mantém a opção em **Configurações → Sessões arquivadas**.
- **Apenas barra lateral (`sidebar`)**: Mostra o ícone na barra lateral e remove o item das configurações para uma interface mais limpa.
- **Apenas configurações (`settings`)** (Padrão): Mantém a barra lateral desobstruída e permite o acesso por **Configurações → Sessões arquivadas**.

### 2. Política de atualizações online (`onlineUpdate` / `updater`)
- Em ambientes corporativos ou restritos, as atualizações podem ser bloqueadas via arquivo de configuração do Cordis:
  ```yaml
  updater: false # ou onlineUpdate: false
  ```
  Isso desativa completamente o mecanismo de atualização no momento da inicialização.

## Guia de utilização

| Ação | Como fazer |
| --- | --- |
| **Arquivar uma conversa** | Abra o menu contextual da sessão na barra lateral e escolha **Arquivar sessão** |
| **Arquivar espaço de trabalho** | Abra o menu do espaço de trabalho e selecione **Arquivar sessão** |
| **Buscar e filtrar** | Abra **Configurações → Sessões arquivadas** ou clique em **Arquivar** na barra lateral |
| **Calendário interativo** | Clique no seletor de data para abrir o popover com navegação completa por teclado |
| **Pré-visualização rápida** | Clique em um resultado ou em **Mais → Pré-visualização rápida** para ler sem restaurar |
| **Ajustar ordenação** | Ordene por recentemente arquivadas, data de atualização, criação ou título |
| **Restaurar conversa** | Clique no ícone de restaurar na linha, ou em **Mais → Restaurar e abrir** |
| **Arquivar grupo inteiro** | Em **Não arquivadas**, use o menu **…** do grupo para arquivar todas as conversas |
| **Marcar como favorita** | Clique no ícone de estrela da linha para marcá-la como favorita |
| **Limpar conversas inativas** | Em **Não arquivadas**, defina os dias de inatividade para pré-visualizar e arquivar |
| **Copiar ID da sessão** | Selecione **Copiar ID da sessão** no menu **Mais** |
| **Limpar subagentes órfãos** | Identifique e remova subagentes órfãos no painel do Organizador |

## Perguntas frequentes (FAQ)

### Por que o atalho não aparece após a instalação?
Reinicie o DSH Web e force o recarregamento da página (`Ctrl+Shift+R`). Verifique se instalou o plugin no perfil correto.

### Qual a diferença entre arquivar e excluir?
Arquivar oculta a conversa permitindo recuperá-la posteriormente. **A exclusão definitiva é irreversível** e remove os dados fisicamente do disco.

### Posso usar junto com o Codex UI?
Sim. O [Codex UI](https://github.com/MichengAI/dsh-codex-ui) mantém sua barra lateral e visual característicos, e o Archive Manager continua totalmente funcional em **Configurações → Sessões arquivadas**.

### Coexistência com outros plugins de arquivamento
O plugin registra-se sob o ID de seção `archive-manager`, coexistindo de forma independente e harmoniosa com outros complementos de arquivamento.

## Licença

Distribuído sob a [Licença Apache 2.0](LICENSE).
