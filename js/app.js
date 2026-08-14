(function () {
  "use strict";

  var chart = echarts.init(document.getElementById("chart"), null, { renderer: "canvas" });
  window.addEventListener("resize", function () { chart.resize(); });

  var updateHint = document.getElementById("updateHint");
  var bubble = document.getElementById("bubble");

  function fmt(v) {
    return (Math.round(v * 10) / 10).toFixed(1);
  }

  function bubbleText(stats) {
    var dist = stats.distanceToGoal;
    var change = stats.change;
    var head;
    if (change < 0) {
      head = "已瘦 " + fmt(-change) + " 斤啦";
    } else if (change > 0) {
      head = "体重回升了点，抱抱你~";
    } else {
      head = "和昨天一样稳，稳住！";
    }
    if (dist <= 0) {
      return "🎉 达成目标 " + fmt(stats.goal) + " 斤！超骄傲！";
    }
    if (dist > 25) return head + "，离目标还差 " + fmt(dist) + " 斤，慢慢来~ 🐾";
    if (dist > 12) return head + "，还剩 " + fmt(dist) + " 斤，坚持住！💪";
    return head + "，就差 " + fmt(dist) + " 斤啦，冲鸭！🐧";
  }

  function render(data, stats) {
    document.getElementById("statDays").textContent = stats.days;
    document.getElementById("statCurrent").textContent = fmt(stats.current);
    document.getElementById("statBest").textContent = fmt(stats.best);
    document.getElementById("statDistance").textContent = fmt(stats.distanceToGoal);
    document.getElementById("goalLabel").textContent = fmt(stats.goal);

    var changeEl = document.getElementById("statChange");
    var change = stats.change;
    changeEl.textContent = (change > 0 ? "+" : "") + fmt(change);
    changeEl.parentElement.classList.toggle("down", change < 0);
    changeEl.parentElement.classList.toggle("up", change > 0);

    var last = data[data.length - 1];
    updateHint.textContent = "数据更新至 " + (last ? last.label + " · " + fmt(last.weight) + " 斤" : "");
    bubble.textContent = bubbleText(stats);
  }

  function draw(data, stats) {
    var labels = data.map(function (d) { return d.label; });
    var values = data.map(function (d) {
      return { value: d.weight, label: d.label, date: d.date, note: d.noteDisplay };
    });

    var yMin = Math.floor(Math.min.apply(null, data.map(function (d) { return d.weight; })) - 4);
    var yMax = Math.ceil(Math.max.apply(null, data.map(function (d) { return d.weight; })) + 4);

    var option = {
      backgroundColor: "transparent",
      grid: { left: 50, right: 20, top: 30, bottom: 28 },
      tooltip: {
        trigger: "axis",
        confine: true,
        backgroundColor: "#ffffff",
        borderColor: "#f3cddd",
        borderWidth: 3,
        textStyle: { color: "#4a4458", fontSize: 12 },
        extraCssText: "border-radius:14px;box-shadow:4px 4px 0 rgba(243,205,221,0.7);",
        formatter: function (params) {
          var p = params[0];
          var d = p.data;
          var html = '<div class="tooltip-box">';
          html += '<div class="tt-date">' + d.label + ' 🐾</div>';
          html += '<div class="tt-weight">' + fmt(d.value) + ' 斤</div>';
          if (d.note) {
            html += '<div class="tt-note">前一天晚饭：' + d.note + '</div>';
          }
          html += '</div>';
          return html;
        }
      },
      axisPointer: {
        type: "line",
        lineStyle: { color: "rgba(242,112,143,0.45)", type: "dashed" },
        label: { backgroundColor: "#f2708f", color: "#fff", borderRadius: 8 }
      },
      xAxis: {
        type: "category",
        data: labels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "rgba(58,53,80,0.18)" } },
        axisTick: { show: false },
        axisLabel: {
          color: "#8b8496",
          fontSize: 11,
          fontWeight: 600,
          margin: 10,
          interval: "auto"
        }
      },
      yAxis: {
        type: "value",
        min: yMin,
        max: yMax,
        splitNumber: 5,
        axisLabel: {
          color: "#8b8496",
          fontSize: 11,
          fontWeight: 600,
          formatter: "{value}"
        },
        splitLine: { lineStyle: { color: "rgba(58,53,80,0.08)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      dataZoom: [
        { type: "inside", start: 0, end: 100, zoomLock: false }
      ],
      series: [
        {
          name: "体重",
          type: "line",
          data: values,
          smooth: 0.4,
          symbol: "circle",
          symbolSize: 7,
          showSymbol: true,
          lineStyle: { width: 4, color: "#f2708f", join: "round" },
          itemStyle: { color: "#ffffff", borderColor: "#f2708f", borderWidth: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(242,112,143,0.28)" },
              { offset: 1, color: "rgba(242,112,143,0.02)" }
            ])
          },
          emphasis: {
            focus: "series",
            itemStyle: { color: "#fff", borderColor: "#f2708f", borderWidth: 4 },
            lineStyle: { width: 5 }
          },
          markLine: {
            silent: true,
            symbol: "none",
            label: { fontWeight: 700 },
            data: [
              {
                name: "目标",
                yAxis: stats.goal,
                lineStyle: { color: "#f2c14e", type: "dashed", width: 3 },
                label: {
                  formatter: "目标 " + fmt(stats.goal) + " 斤 🎯",
                  color: "#c08f1c",
                  fontSize: 11,
                  position: "insideEndTop"
                }
              },
              {
                name: "最佳",
                yAxis: stats.best,
                lineStyle: { color: "#ff9e7d", type: "dotted", width: 3 },
                label: {
                  formatter: "最佳 " + fmt(stats.best) + " 斤 🏆",
                  color: "#d16a45",
                  fontSize: 11,
                  position: "insideEndBottom"
                }
              }
            ]
          }
        }
      ]
    };

    chart.setOption(option, true);
    chart.resize();
  }

  function displayNote(note) {
    if (note.indexOf("否。") === 0) return "没吃晚饭。" + note.substring(2);
    if (note.indexOf("否") === 0) return "没吃晚饭" + note.substring(1);
    if (note.indexOf("是。") === 0) return "吃了晚饭。" + note.substring(2);
    if (note.indexOf("是") === 0) return "吃了晚饭" + note.substring(1);
    return note;
  }

  function parseWeightMarkdown(text) {
    var records = [];
    var lines = text.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.charAt(0) !== "|") continue;
      var cells = line.split("|");
      if (cells.length < 4) continue;
      var dateStr = cells[1].trim();
      if (!/^\d{2}\.\d{2}$/.test(dateStr)) continue;
      var weight = parseFloat(cells[2].trim());
      if (isNaN(weight)) continue;
      var note = cells[3].trim();
      records.push({
        label: dateStr,
        date: "2026-" + dateStr.replace(".", "-"),
        weight: weight,
        note: note,
        noteDisplay: displayNote(note)
      });
    }
    return records;
  }

  function computeStats(records, goal) {
    var weights = records.map(function (r) { return r.weight; });
    var best = Math.min.apply(null, weights);
    var first = weights[0];
    var current = weights[weights.length - 1];
    var change = Math.round((current - first) * 10) / 10;
    var distance = Math.round((current - goal) * 10) / 10;
    return {
      days: records.length,
      current: Math.round(current * 10) / 10,
      best: Math.round(best * 10) / 10,
      first: Math.round(first * 10) / 10,
      distanceToGoal: distance,
      change: change,
      goal: goal
    };
  }

  function load() {
    updateHint.textContent = "正在刷新…";
    fetch("weight_2026.md")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (text) {
        var data = parseWeightMarkdown(text);
        if (!data || !data.length) {
          updateHint.textContent = "暂无体重数据";
          return;
        }
        var stats = computeStats(data, 150);
        render(data, stats);
        draw(data, stats);
      })
      .catch(function (err) {
        updateHint.textContent = "加载失败：" + err.message;
      });
  }

  load();
  setInterval(load, 60000);
})();
